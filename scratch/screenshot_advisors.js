const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\30e878ba-dc4c-4db7-a3a9-a3461d23c3f2';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  function getPageTarget() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9223/json/list', res => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          const targets = JSON.parse(d);
          const page = targets.find(t => t.type === 'page') || targets[0];
          resolve(page);
        });
      }).on('error', reject);
    });
  }

  const target = await getPageTarget();
  console.log('Target WS:', target.webSocketDebuggerUrl);

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
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  // Wait for page to load
  await new Promise(r => setTimeout(r, 2500));

  // Scroll to advisor section
  await send('Runtime.evaluate', {
    expression: `
      const el = document.querySelector('h2:is(:contains("Meet Our Senior Advisory Partners"))') || Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Meet Our Senior Advisory Partners'));
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  // Take screenshot of index.html
  const screenshot1 = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot1 && screenshot1.data) {
    const outPath1 = path.join(artifactDir, 'index_advisors_fixed.png');
    fs.writeFileSync(outPath1, Buffer.from(screenshot1.data, 'base64'));
    console.log('Saved index.html screenshot to:', outPath1);
  }

  // Now navigate to advisors.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/advisors.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to advisors grid
  await send('Runtime.evaluate', {
    expression: `
      const grid = document.getElementById('advisorsGrid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  const screenshot2 = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot2 && screenshot2.data) {
    const outPath2 = path.join(artifactDir, 'advisors_page_fixed.png');
    fs.writeFileSync(outPath2, Buffer.from(screenshot2.data, 'base64'));
    console.log('Saved advisors.html screenshot to:', outPath2);
  }

  ws.close();
  chrome.kill();
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
