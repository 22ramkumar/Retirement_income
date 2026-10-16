const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5560;
const DEBUG_PORT = 9340;

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
    '--window-size=1440,900',
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

  const pages = [
    'index.html',
    'home-2.html',
    'services.html',
    'advisors.html',
    'about.html',
    'login.html',
    'user.html'
  ];

  const breakpoints = [1440, 1280, 1024, 912, 834, 768, 480, 430, 414, 390, 375, 320];

  const results = [];

  for (const page of pages) {
    console.log(`Auditing ${page}...`);
    const pageIssues = { page, breakpoints: {} };

    for (const width of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 800,
        deviceScaleFactor: 1,
        mobile: width < 1024
      });

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
      await new Promise(r => setTimeout(r, 600));

      const audit = await send('Runtime.evaluate', {
        expression: `JSON.stringify((() => {
          const w = window.innerWidth;
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          const hasHScroll = docW > w + 2 || bodyW > w + 2;

          // Find overflowing visible elements (ignoring off-screen drawers)
          const overflowing = [];
          document.querySelectorAll('body *').forEach(el => {
            if (['SCRIPT', 'STYLE', 'LINK', 'HEAD', 'META', 'BR'].includes(el.tagName)) return;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
            // Ignore fixed drawers positioned off-screen
            if ((style.position === 'fixed' || style.position === 'absolute') && (el.classList.contains('-translate-x-full') || style.transform.includes('-') || parseInt(style.left) < -50)) return;
            
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              if (r.right > w + 3 && !el.closest('[style*="overflow-x: auto"], .overflow-x-auto, .overflow-hidden')) {
                overflowing.push({
                  tag: el.tagName,
                  id: el.id,
                  class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
                  right: Math.round(r.right),
                  excess: Math.round(r.right - w)
                });
              }
            }
          });

          // Check all tables have responsive wrapper
          const unwrappedTables = [];
          document.querySelectorAll('table').forEach(tbl => {
            const wrapper = tbl.closest('.overflow-x-auto, [style*="overflow-x: auto"]');
            if (!wrapper) {
              unwrappedTables.push({
                id: tbl.id,
                class: tbl.className ? tbl.className.slice(0, 40) : '',
                width: Math.round(tbl.getBoundingClientRect().width)
              });
            }
          });

          return {
            width: w,
            hasHScroll,
            excessWidth: Math.max(0, docW - w, bodyW - w),
            overflowCount: overflowing.length,
            overflowing: overflowing.slice(0, 5),
            unwrappedTables
          };
        })())`
      });

      let resObj = null;
      try {
        resObj = JSON.parse(audit.result.value);
      } catch (e) {
        resObj = { error: 'Parse error' };
      }

      if (resObj.hasHScroll || resObj.overflowCount > 0 || (resObj.unwrappedTables && resObj.unwrappedTables.length > 0)) {
        pageIssues.breakpoints[width] = resObj;
      }
    }

    results.push(pageIssues);
  }

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(JSON.stringify(results, null, 2));

  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
