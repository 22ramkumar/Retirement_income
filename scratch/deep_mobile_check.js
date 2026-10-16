const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5527;
const DEBUG_PORT = 9301;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith(path.sep) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function main() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=375,812',
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

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  const detailedChecks = [];

  const pages = [
    'index.html',
    'home-2.html',
    'services.html',
    'advisors.html',
    'about.html',
    'login.html',
    'user.html'
  ];

  for (const page of pages) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
    await new Promise(r => setTimeout(r, 1500));

    // Evaluate in depth alignment & overflow checks
    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const issues = [];
        const winW = window.innerWidth;
        
        // 1. Check all elements bounds
        document.querySelectorAll('body *').forEach(el => {
          if (['SCRIPT', 'STYLE', 'LINK', 'HEAD', 'META', 'BR', 'svg', 'path'].includes(el.tagName)) return;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Horizontal bleed
            if (rect.right > winW + 2) {
              issues.push({
                type: 'overflow-right',
                tag: el.tagName,
                id: el.id,
                className: el.className?.slice ? el.className.slice(0, 80) : '',
                right: Math.round(rect.right),
                excess: Math.round(rect.right - winW),
                text: el.innerText ? el.innerText.trim().slice(0, 30) : ''
              });
            }
            if (rect.left < -2) {
              issues.push({
                type: 'overflow-left',
                tag: el.tagName,
                id: el.id,
                className: el.className?.slice ? el.className.slice(0, 80) : '',
                left: Math.round(rect.left),
                text: el.innerText ? el.innerText.trim().slice(0, 30) : ''
              });
            }
          }
        });

        // 2. Check button text truncation or wrap awkwardness
        document.querySelectorAll('button, a.btn-primary-gold, a.btn-secondary-teal, a.btn-outline-navy').forEach(btn => {
          const r = btn.getBoundingClientRect();
          if (r.width > winW - 20) {
            issues.push({
              type: 'button-too-wide',
              tag: btn.tagName,
              text: btn.innerText.trim().slice(0, 30),
              width: Math.round(r.width),
              winW
            });
          }
        });

        // 3. Check mobile drawer functionality
        const menuBtn = document.getElementById('mobileMenuBtn');
        let drawerWorks = null;
        if (menuBtn) {
          menuBtn.click();
          const drawer = document.getElementById('mobileDrawer');
          const dRect = drawer ? drawer.getBoundingClientRect() : null;
          drawerWorks = drawer && dRect && dRect.width > 0;
          const closeBtn = document.getElementById('closeMobileDrawer');
          if (closeBtn) closeBtn.click();
        }

        return {
          page: window.location.pathname,
          issuesCount: issues.length,
          issues: issues.slice(0, 15),
          drawerWorks
        };
      })()`,
      returnByValue: true
    });

    detailedChecks.push(evalResult.result.value);

    // Also capture scrolled screenshots (middle of page and bottom)
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 700);` });
    await new Promise(r => setTimeout(r, 600));
    const shotMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, `mobile_${page.replace('.html', '')}_mid.png`), Buffer.from(shotMid.data, 'base64'));

    await send('Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight - 900);` });
    await new Promise(r => setTimeout(r, 600));
    const shotBot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, `mobile_${page.replace('.html', '')}_bot.png`), Buffer.from(shotBot.data, 'base64'));
  }

  console.log('Detailed mobile check results:\n', JSON.stringify(detailedChecks, null, 2));

  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  try { server.close(); } catch(_) {}
  process.exit(1);
});
