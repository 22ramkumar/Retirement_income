const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const DEBUG_PORT = 9494;

async function run() {
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=' + DEBUG_PORT, '--window-size=1440,900', '--disable-gpu', '--no-sandbox']);
  await new Promise(r => setTimeout(r, 1500));
  const page = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + DEBUG_PORT + '/json/list', res => {
      let d = ''; res.on('data', chunk => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)[0]));
    }).on('error', reject);
  });
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  };
  function send(m, p={}) { return new Promise(r => { const msgId = id++; pending.set(msgId, r); ws.send(JSON.stringify({ id: msgId, method: m, params: p })); }); }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/user.html' });
  await new Promise(r => setTimeout(r, 1000));
  await send('Runtime.evaluate', { expression: "RetireWellApp.setTheme('dark'); toggleProfileDropdown(true);" });
  await new Promise(r => setTimeout(r, 500));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'dashboard_dark_signout.png'), Buffer.from(snap.data, 'base64'));
  console.log('Saved dashboard_dark_signout.png');
  ws.close();
  chrome.kill();
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
