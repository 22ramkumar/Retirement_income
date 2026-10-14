const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function testModes() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9280',
    '--window-size=1440,960',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9280/json/list', res => {
            let d = ''; res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const list = JSON.parse(d);
                const p = list.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension:')) || list[0];
                resolve(p);
              } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
        if (page && page.webSocketDebuggerUrl) return page;
      } catch (e) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    throw new Error('Could not connect to Chrome 9280');
  }

  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise(r => {
      const msgId = id++;
      pending.set(msgId, r);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (pending.has(d.id)) {
      pending.get(d.id)(d.result);
      pending.delete(d.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/login.html?switch=true' });
  await new Promise(r => setTimeout(r, 1200));

  // Toggle Dark Mode
  await send('Runtime.evaluate', { expression: 'RetireWellApp.toggleTheme()' });
  await new Promise(r => setTimeout(r, 600));
  const darkSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'client_portal_dark_verified.png'), Buffer.from(darkSnap.data, 'base64'));
  console.log('Saved client_portal_dark_verified.png');

  // Toggle RTL
  await send('Runtime.evaluate', { expression: 'RetireWellApp.toggleRTL()' });
  await new Promise(r => setTimeout(r, 600));
  const rtlSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'client_portal_rtl_verified.png'), Buffer.from(rtlSnap.data, 'base64'));
  console.log('Saved client_portal_rtl_verified.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

testModes().catch(e => {
  console.error(e);
  process.exit(1);
});
