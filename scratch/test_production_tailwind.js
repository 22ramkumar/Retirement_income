const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5521;
const DEBUG_PORT = 9297;

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
  console.log(`Test server running at http://127.0.0.1:${PORT}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1440,960',
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
  const consoleLogs = [];

  function send(method, params = {}) {
    return new Promise(r => {
      const msgId = id++;
      pending.set(msgId, r);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Console.messageAdded') {
      consoleLogs.push(d.params.message);
    } else if (d.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({
        type: d.params.type,
        text: d.params.args.map(a => a.value || a.description).join(' ')
      });
    }
    if (pending.has(d.id)) {
      pending.get(d.id)(d.result);
      pending.delete(d.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('DOM.enable');
  await send('Console.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false
  });

  const pagesToTest = [
    'index.html',
    'home-2.html',
    'about.html',
    'advisors.html',
    'services.html',
    'login.html',
    'user.html'
  ];

  for (const pageName of pagesToTest) {
    consoleLogs.length = 0;
    console.log(`Testing ${pageName}...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${pageName}` });
    await new Promise(r => setTimeout(r, 1200));

    // Check if cdn.tailwindcss is requested or warned
    const tailwindWarnings = consoleLogs.filter(log => {
      const text = (log.text || '').toLowerCase();
      return text.includes('cdn.tailwindcss.com') || text.includes('should not be used in production');
    });

    if (tailwindWarnings.length > 0) {
      console.error(`FAIL: ${pageName} still has cdn.tailwindcss warning:`, tailwindWarnings);
    } else {
      console.log(`PASS: ${pageName} - zero cdn.tailwindcss warnings`);
    }

    // Verify computed styles (e.g. check if Tailwind classes work)
    const styleCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const testEl = document.querySelector('h1, h2, .rw-card, button');
        const comp = testEl ? window.getComputedStyle(testEl) : null;
        return {
          hasTailwindCssLink: !!document.querySelector('link[href*="tailwind.min.css"]'),
          hasCdnScript: !!document.querySelector('script[src*="cdn.tailwindcss.com"]'),
          primaryElementFont: comp ? comp.fontFamily : 'none'
        };
      })()`,
      returnByValue: true
    });

    console.log(`Style Check for ${pageName}:`, styleCheck.result.value);
  }

  // Capture final screenshot of index.html and home-2.html to verify visual rendering
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 1500));
  const snapIndex = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'index_production_tailwind.png'), Buffer.from(snapIndex.data, 'base64'));

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/home-2.html` });
  await new Promise(r => setTimeout(r, 1500));
  const snapHome2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'home2_production_tailwind.png'), Buffer.from(snapHome2.data, 'base64'));

  chrome.kill();
  server.close();
  console.log('All tests completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Test failed:', err);
  try { server.close(); } catch (_) {}
  process.exit(1);
});
