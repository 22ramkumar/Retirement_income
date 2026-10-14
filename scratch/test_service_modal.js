const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'services.html').replace(/\\/g, '/');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9281',
  '--window-size=1440,1100',
  fileUrl
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9281/json/list').then(r => r.json());
    const target = list.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
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
    await new Promise(r => setTimeout(r, 1500));

    const res = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const btn = document.querySelector('button[onclick*="openServiceDetailModal"]');
          btn.click();
          const m = document.getElementById('serviceDetailModal');
          return {
            className: m ? m.className : 'no modal',
            isActive: m ? m.classList.contains('active') : false,
            title: document.getElementById('detailTitle')?.textContent,
            htmlLen: document.getElementById('detailBody')?.innerHTML?.length
          };
        })()
      `
    });
    console.log('Result:', JSON.stringify(res, null, 2));

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Ramkumar/.gemini/antigravity-ide/brain/22685039-72ec-48f8-ba4b-8bc48e08ff96/fixed_service_modal_live.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved fixed_service_modal_live.png');

    ws.close();
    chrome.kill();
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 1500);
