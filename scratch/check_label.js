const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function check() {
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'login.html').replace(/\\/g, '/') + '?switch=true';
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9296', '--disable-gpu', '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const page = await new Promise(res => {
    http.get('http://127.0.0.1:9296/json/list', r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const targets = JSON.parse(d);
        const p = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension:')) || targets[0];
        res(p);
      });
    });
  });
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const msgId = id++;
    const h = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === msgId) { ws.removeEventListener('message', h); res(data.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: msgId, method: m, params: p }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 500));
  await send('Runtime.evaluate', { expression: "localStorage.clear();" });
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1200));
  await send('Runtime.evaluate', { expression: "document.documentElement.setAttribute('dir', 'rtl');" });
  await new Promise(r => setTimeout(r, 500));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const results = [];
      document.querySelectorAll("label").forEach(l => {
        if (l.textContent.includes("*")) {
          const lR = l.getBoundingClientRect();
          const cs = window.getComputedStyle(l);
          const range = document.createRange();
          const tn = Array.from(l.childNodes).find(n => n.nodeType === 3 && n.textContent.includes("*"));
          if (tn) {
            const idx = tn.textContent.indexOf("*");
            range.setStart(tn, idx);
            range.setEnd(tn, idx + 1);
            const sR = range.getBoundingClientRect();
            results.push({
              text: l.textContent.trim(),
              direction: cs.direction,
              textAlign: cs.textAlign,
              starX: Math.round(sR.x),
              labelX: Math.round(lR.x),
              labelRight: Math.round(lR.x + lR.width),
              isStarAtRightEnd: sR.x > lR.x + 30
            });
          }
        }
      });
      return results;
    })()`,
    returnByValue: true
  });
  console.log(res.result.value);
  ws.close();
  chrome.kill();
  process.exit(0);
}
check().catch(console.error);
