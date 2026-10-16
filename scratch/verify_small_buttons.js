const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const DEBUG_PORT = 9388;

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1280,900',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getTarget() {
    for (let i = 0; i < 20; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${DEBUG_PORT}/json/list`, res => {
            let d = ''; res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const list = JSON.parse(d);
                const p = list.find(t => t.type === 'page') || list[0];
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
    throw new Error('Could not connect to Chrome debugging port');
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

  await new Promise(r => { ws.onopen = r; });

  await send('Page.enable');
  await send('DOM.enable');

  const testPages = [
    { url: 'http://127.0.0.1:5500/index.html', name: 'index' },
    { url: 'http://127.0.0.1:5500/services.html', name: 'services' },
    { url: 'http://127.0.0.1:5500/advisors.html', name: 'advisors' },
    { url: 'http://127.0.0.1:5500/login.html?switch=true', name: 'login' },
    { url: 'http://127.0.0.1:5500/user.html', name: 'user' }
  ];

  for (const p of testPages) {
    // 1. Desktop
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: p.url });
    await new Promise(r => setTimeout(r, 1200));

    // Get button metrics
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button, a.btn-primary-gold, a.btn-secondary-teal, a.btn-outline-navy'));
          return JSON.stringify(btns.filter(b => b.offsetParent !== null).slice(0, 8).map(b => {
            const cs = window.getComputedStyle(b);
            return {
              text: (b.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 25),
              fontSize: cs.fontSize,
              padding: \`\${cs.paddingTop} \${cs.paddingRight} \${cs.paddingBottom} \${cs.paddingLeft}\`,
              height: Math.round(b.getBoundingClientRect().height)
            };
          }));
        })()
      `
    });

    console.log(`\n=== [${p.name.toUpperCase()}] BUTTON METRICS ===`);
    console.log(evalRes && evalRes.result ? evalRes.result.value : 'none');

    // Desktop Screenshot
    const deskShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, `small_buttons_${p.name}_desktop.png`), Buffer.from(deskShot.data, 'base64'));

    // 2. Mobile View
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const mobShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, `small_buttons_${p.name}_mobile.png`), Buffer.from(mobShot.data, 'base64'));
  }

  ws.close();
  chrome.kill();
  console.log('\nAll verification screenshots captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
