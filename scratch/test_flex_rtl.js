const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9252', '--disable-gpu', '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const page = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9252/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)[0]));
    });
  });
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const mid = id++;
    const handler = (evt) => {
      const d = JSON.parse(evt.data);
      if (d.id === mid) { ws.removeEventListener('message', handler); res(d); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/test_rtl.html' });
  await new Promise(r => setTimeout(r, 1000));

  const check = await send('Runtime.evaluate', {
    expression: `
      (() => {
        function check(caseName, iId, sId) {
          const iEl = document.getElementById(iId);
          const sEl = document.getElementById(sId);
          const iR = iEl.getBoundingClientRect();
          const sR = sEl.getBoundingClientRect();
          return {
            case: caseName,
            iconX: Math.round(iR.x),
            spanX: Math.round(sR.x),
            isIconOnRightOfSpan: iR.x > sR.x
          };
        }
        return JSON.stringify([
          check('Case A (span then icon):', 'iconA', 'spanA'),
          check('Case B (span then icon + row-reverse):', 'iconB', 'spanB'),
          check('Case C (icon then span):', 'iconC', 'spanC')
        ], null, 2);
      })()
    `
  });
  console.log(JSON.stringify(check, null, 2));
  ws.close();
  chrome.kill();
  process.exit(0);
}
test().catch(console.error);
