const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9289',
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
          http.get('http://127.0.0.1:9289/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9289');
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

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 1500));

  // Capture full hero view with centered CTA
  const fullHero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'hero_centered_cta_full.png'), Buffer.from(fullHero.data, 'base64'));
  console.log('Saved hero_centered_cta_full.png');

  // Clip the left container specifically
  const cardClip = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.querySelector('.lg\\:col-span-7');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x - 10, y: r.y - 10, width: r.width + 20, height: r.height + 20, scale: 1 };
      })()
    `,
    returnByValue: true
  });

  if (cardClip.result.value) {
    const cardSnap = await send('Page.captureScreenshot', { format: 'png', clip: cardClip.result.value });
    fs.writeFileSync(path.join(artifactDir, 'hero_card_centered_cta.png'), Buffer.from(cardSnap.data, 'base64'));
    console.log('Saved hero_card_centered_cta.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(e => {
  console.error(e);
  process.exit(1);
});
