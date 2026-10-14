const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';
const url = 'http://127.0.0.1:5500/index.html';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9273',
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9273/json/list', res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const targets = JSON.parse(d);
                const p = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension:')) || targets[0];
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
    throw new Error('Failed to connect to Chrome on port 9273');
  }

  const target = await getPageTarget();
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

  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 1500));

  // Capture navbar brand area
  const brandInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const brand = document.querySelector('a[aria-label="RetireWell Homepage"]');
        if (!brand) return { found: false, text: document.body.innerText.slice(0, 100) };
        const rect = brand.getBoundingClientRect();
        return {
          found: true,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Brand element info:', brandInfo.result.value);

  if (brandInfo.result.value && brandInfo.result.value.found) {
    const b = brandInfo.result.value;
    const clip = {
      x: Math.max(0, b.x - 10),
      y: Math.max(0, b.y - 10),
      width: b.width + 30,
      height: b.height + 20,
      scale: 2
    };
    const snap = await send('Page.captureScreenshot', { format: 'png', clip });
    fs.writeFileSync(path.join(artifactDir, 'navbar_brand_no_fiduciary.png'), Buffer.from(snap.data, 'base64'));
    console.log('Saved navbar_brand_no_fiduciary.png');
  }

  // Full top navbar
  const fullNav = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1440, height: 95, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'navbar_header_full.png'), Buffer.from(fullNav.data, 'base64'));
  console.log('Saved navbar_header_full.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(e => {
  console.error(e);
  process.exit(1);
});
