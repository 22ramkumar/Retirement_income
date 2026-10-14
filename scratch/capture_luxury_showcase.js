const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function captureLuxuryShowcase() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--window-size=1440,1050',
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9288/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9288');
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

  const screenshots = [
    { url: 'http://127.0.0.1:5500/index.html', name: 'luxury_home_hero.png', scroll: 0, dark: false },
    { url: 'http://127.0.0.1:5500/index.html', name: 'luxury_home_estimator.png', scroll: 720, dark: false },
    { url: 'http://127.0.0.1:5500/index.html', name: 'luxury_home_annuities.png', scroll: 1850, dark: false },
    { url: 'http://127.0.0.1:5500/services.html', name: 'luxury_services_grid.png', scroll: 380, dark: false },
    { url: 'http://127.0.0.1:5500/advisors.html', name: 'luxury_advisors_grid.png', scroll: 350, dark: false },
    { url: 'http://127.0.0.1:5500/index.html', name: 'luxury_home_dark.png', scroll: 0, dark: true },
    { url: 'http://127.0.0.1:5500/services.html', name: 'luxury_services_dark.png', scroll: 380, dark: true }
  ];

  for (const s of screenshots) {
    await send('Page.navigate', { url: s.url });
    await new Promise(r => setTimeout(r, 1200));

    if (s.dark) {
      await send('Runtime.evaluate', {
        expression: `
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('retirewell_theme', 'dark');
        `
      });
      await new Promise(r => setTimeout(r, 300));
    } else {
      await send('Runtime.evaluate', {
        expression: `
          document.documentElement.classList.remove('dark');
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('retirewell_theme', 'light');
        `
      });
      await new Promise(r => setTimeout(r, 300));
    }

    if (s.scroll > 0) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${s.scroll}, behavior: 'instant' })`
      });
      await new Promise(r => setTimeout(r, 400));
    }

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, s.name), Buffer.from(snap.data, 'base64'));
    console.log('Successfully captured and saved:', s.name);
  }

  ws.close();
  chrome.kill();
  console.log('All luxury showcase screenshots captured.');
  process.exit(0);
}

captureLuxuryShowcase().catch(e => {
  console.error(e);
  process.exit(1);
});
