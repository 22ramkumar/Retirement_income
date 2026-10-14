const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9248', '--disable-gpu', '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const page = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9248/json/list', r => {
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
        const btns = Array.from(document.querySelectorAll('button, a.btn-primary-gold, a#heroPortalBtn'));
        return btns.map(b => ({
          tag: b.tagName,
          text: b.textContent.trim().replace(/\\s+/g, ' '),
          classes: b.className,
          rect: b.getBoundingClientRect()
        }));
      })()
    `,
    returnByValue: true
  });
  console.log('Buttons:', check.result.value);
  ws.close();
  chrome.kill();
  process.exit(0);
}
test().catch(console.error);
