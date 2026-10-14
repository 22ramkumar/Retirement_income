const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9278',
    '--window-size=1440,960',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9278/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9278');
  }

  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  // 1. Capture Login Tab
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/login.html?switch=true' });
  await new Promise(r => setTimeout(r, 1500));

  const loginSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'client_portal_login_verified.png'), Buffer.from(loginSnap.data, 'base64'));
  console.log('Saved client_portal_login_verified.png');

  // 2. Switch to Sign Up (Register) Tab
  await send('Runtime.evaluate', {
    expression: `switchAuthTab('register')`
  });
  await new Promise(r => setTimeout(r, 500));

  const signupSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'client_portal_signup_verified.png'), Buffer.from(signupSnap.data, 'base64'));
  console.log('Saved client_portal_signup_verified.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
