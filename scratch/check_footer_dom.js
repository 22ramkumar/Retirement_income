const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9251',
  '--window-size=1440,1100'
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9251/json/list').then(r => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = Math.floor(Math.random() * 100000);
        const handler = (evt) => {
          const d = JSON.parse(evt.data);
          if (d.id === id) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 1200));

    const check = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const f = document.querySelector('footer');
          const mount = document.getElementById('footer');
          return {
            hasFooterTag: !!f,
            mountInnerLen: mount ? mount.innerHTML.length : 0,
            bodyScrollH: document.body.scrollHeight,
            footerTop: f ? f.getBoundingClientRect().top + window.scrollY : null
          };
        })()
      `
    });

    console.log('Check result:', check.result ? check.result.value : check);

    ws.close();
    chrome.kill();
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 1200);
