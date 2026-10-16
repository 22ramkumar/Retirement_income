const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5525;
const DEBUG_PORT = 9299;

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
  console.log(`Server listening on http://127.0.0.1:${PORT}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=390,844',
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
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  const pages = [
    'index.html',
    'home-2.html',
    'about.html',
    'advisors.html',
    'services.html',
    'login.html',
    'user.html'
  ];

  const results = {};

  for (const page of pages) {
    console.log(`\n================ Testing ${page} (375x812) ================`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
    await new Promise(r => setTimeout(r, 2000));

    // Audit script inside page
    const auditRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasHOverflow = docW > winW;
        
        // Find elements causing horizontal overflow
        const overflowingElements = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          // Ignore SVG defs or script/style/link/head
          if (['SCRIPT', 'STYLE', 'LINK', 'HEAD', 'META', 'TITLE', 'BR'].includes(el.tagName)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.right > winW + 1) {
              overflowingElements.push({
                tag: el.tagName,
                id: el.id || null,
                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 100) : '',
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                text: el.innerText ? el.innerText.trim().slice(0, 50) : ''
              });
            }
          }
        }

        // Check navbar on mobile
        const navbar = document.getElementById('navbar');
        const mobileToggle = document.getElementById('mobileMenuToggle') || document.querySelector('[aria-label="Toggle Navigation"]');
        const mobileDrawer = document.getElementById('mobileMenuDrawer');

        // Check cards and grids
        const cards = Array.from(document.querySelectorAll('.rw-card, .rw-card-glass, section > div')).map(c => {
          const r = c.getBoundingClientRect();
          return {
            classes: (c.className && typeof c.className === 'string') ? c.className.slice(0, 60) : '',
            width: Math.round(r.width),
            left: Math.round(r.left),
            right: Math.round(r.right),
            isOverflowing: r.right > winW + 1
          };
        }).filter(c => c.isOverflowing);

        // Check table overflow
        const tables = Array.from(document.querySelectorAll('table')).map(t => {
          const r = t.getBoundingClientRect();
          const parent = t.parentElement;
          const parentOverflow = parent ? window.getComputedStyle(parent).overflowX : '';
          return {
            width: Math.round(r.width),
            parentOverflow,
            parentWidth: parent ? Math.round(parent.getBoundingClientRect().width) : 0,
            hasScrollWrapper: parentOverflow === 'auto' || parentOverflow === 'scroll'
          };
        });

        return {
          winW,
          docW,
          hasHOverflow,
          overflowingCount: overflowingElements.length,
          overflowingSample: overflowingElements.slice(0, 10),
          cardsOverflowing: cards,
          tables,
          hasMobileToggle: !!mobileToggle,
          hasMobileDrawer: !!mobileDrawer
        };
      })()`,
      returnByValue: true
    });

    results[page] = auditRes.result.value;
    console.log(`Result for ${page}:`, JSON.stringify(results[page], null, 2));

    // Capture mobile top screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, `mobile_${page.replace('.html', '')}_top.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${shotPath}`);
  }

  fs.writeFileSync(path.join(artifactDir, 'mobile_audit_results.json'), JSON.stringify(results, null, 2));

  chrome.kill();
  server.close();
  console.log('\nMobile audit complete.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  try { server.close(); } catch (_) {}
  process.exit(1);
});
