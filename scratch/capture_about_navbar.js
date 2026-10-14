const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9287',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1440,960',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9287/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9287');
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

  // 1. Capture Index page with new About option in Navbar
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 1500));

  // Clip the top navbar specifically
  const navClip = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nav = document.getElementById('mainNavbar');
        if (!nav) return null;
        const r = nav.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height + 20, scale: 1 };
      })()
    `,
    returnByValue: true
  });
  if (navClip.result.value) {
    const navSnap = await send('Page.captureScreenshot', { format: 'png', clip: navClip.result.value });
    fs.writeFileSync(path.join(artifactDir, 'navbar_about_option.png'), Buffer.from(navSnap.data, 'base64'));
    console.log('Saved navbar_about_option.png');
  }

  // 2. Navigate to about.html and capture full page
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/about.html' });
  await new Promise(r => setTimeout(r, 1500));
  const aboutSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'about_page_verified.png'), Buffer.from(aboutSnap.data, 'base64'));
  console.log('Saved about_page_verified.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(e => {
  console.error(e);
  process.exit(1);
});
