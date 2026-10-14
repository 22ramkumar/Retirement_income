const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9246', '--disable-gpu', '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const page = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9246/json/list', r => {
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
      if (d.id === mid) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 2000));
  await send('Runtime.evaluate', { expression: 'document.documentElement.setAttribute("dir", "rtl");' });
  await new Promise(r => setTimeout(r, 500));
  const check = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[onclick*="openBookingModal"]');
        const icon = btn.querySelector('i');
        const span = btn.querySelector('span');
        const bRect = btn.getBoundingClientRect();
        const iRect = icon.getBoundingClientRect();
        const sRect = span.getBoundingClientRect();
        return JSON.stringify({
          btnHtml: btn.outerHTML,
          btnFlexDir: window.getComputedStyle(btn).flexDirection,
          btnDisplay: window.getComputedStyle(btn).display,
          btnDirection: window.getComputedStyle(btn).direction,
          bRect: { left: bRect.left, right: bRect.right },
          iRect: { left: iRect.left, right: iRect.right },
          sRect: { left: sRect.left, right: sRect.right }
        }, null, 2);
      })()
    `
  });
  console.log('check:', JSON.stringify(check, null, 2));
  ws.close();
  chrome.kill();
  process.exit(0);
}
test().catch(console.error);
