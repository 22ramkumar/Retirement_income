const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\30e878ba-dc4c-4db7-a3a9-a3461d23c3f2';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9260',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9260/json/list', res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const targets = JSON.parse(d);
                const p = targets.find(t => t.type === 'page') || targets[0];
                resolve(p);
              } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
        if (page && page.webSocketDebuggerUrl) return page;
      } catch (e) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    throw new Error('Failed to connect to Chrome on port 9260');
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

  // 1. Load index.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Set RTL
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('dir', 'rtl');
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // Screenshot 1: Hero
  let snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'rtl_hero_fixed.png'), Buffer.from(snap.data, 'base64'));

  // Screenshot 2: Core Promise Cards (scroll to ~1800px)
  await send('Runtime.evaluate', {
    expression: `
      const target = document.querySelector('.card-check-pill') || document.querySelector('.bi-check2');
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 1800);
      }
    `
  });
  await new Promise(r => setTimeout(r, 800));
  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'rtl_cards_fixed.png'), Buffer.from(snap.data, 'base64'));

  // Screenshot 3: Estimator section (scroll to #estimatorWidget)
  await send('Runtime.evaluate', {
    expression: `
      const est = document.getElementById('estimatorWidget');
      if (est) est.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 800));
  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'rtl_estimator_fixed.png'), Buffer.from(snap.data, 'base64'));

  // Screenshot 4: FAQ Accordion
  await send('Runtime.evaluate', {
    expression: `
      const faq = document.getElementById('faqAccordion');
      if (faq) faq.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 800));
  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'rtl_faqs_fixed.png'), Buffer.from(snap.data, 'base64'));

  // Screenshot 5: Home 2 solution cards
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/home-2.html' });
  await new Promise(r => setTimeout(r, 2000));
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('dir', 'rtl');
      const sol = document.querySelector('.solution-check-item');
      if (sol) sol.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 800));
  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'rtl_home2_solution_fixed.png'), Buffer.from(snap.data, 'base64'));

  ws.close();
  chrome.kill();
  console.log('All RTL screenshots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
