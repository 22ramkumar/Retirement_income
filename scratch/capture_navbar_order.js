const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9292',
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const page = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9292/json/list', res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)[0]));
    }).on('error', reject);
  });

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  let loadFired = false;

  function send(method, params = {}) {
    return new Promise(r => {
      const msgId = id++;
      pending.set(msgId, r);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Page.loadEventFired') {
      loadFired = true;
    }
    if (pending.has(d.id)) {
      pending.get(d.id)(d.result);
      pending.delete(d.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  for (let i = 0; i < 20; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));

  const domCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const links = Array.from(document.querySelectorAll('#mainNavbar nav a')).map(a => a.textContent.trim().replace(/\\s+/g, ' '));
        return {
          title: document.title,
          links: links
        };
      })()
    `,
    returnByValue: true
  });
  console.log('DOM check:', domCheck.result.value);

  // Capture top navbar specifically
  const clip = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('mainNavbar');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: 0, y: 0, width: 1440, height: Math.max(90, Math.ceil(r.height)), scale: 1 };
      })()
    `,
    returnByValue: true
  });

  if (clip.result.value) {
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: clip.result.value
    });
    fs.writeFileSync(path.join(artifactDir, 'navbar_about_4th.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved navbar_about_4th.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
