const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capturePages() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9285',
    '--window-size=1440,1050',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9285/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9285');
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

  const pages = [
    { url: 'http://127.0.0.1:5500/index.html', name: 'audit_home.png', scroll: 0 },
    { url: 'http://127.0.0.1:5500/index.html', name: 'audit_home_products.png', scroll: 1200 },
    { url: 'http://127.0.0.1:5500/services.html', name: 'audit_services.png', scroll: 300 },
    { url: 'http://127.0.0.1:5500/advisors.html', name: 'audit_advisors.png', scroll: 250 }
  ];

  for (const p of pages) {
    await send('Page.navigate', { url: p.url });
    await new Promise(r => setTimeout(r, 1200));
    if (p.scroll > 0) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${p.scroll}, behavior: 'instant' })`
      });
      await new Promise(r => setTimeout(r, 400));
    }
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, p.name), Buffer.from(snap.data, 'base64'));
    console.log('Saved', p.name);
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

capturePages().catch(e => {
  console.error(e);
  process.exit(1);
});
