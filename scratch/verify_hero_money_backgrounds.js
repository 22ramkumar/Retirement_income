const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5519;
const DEBUG_PORT = 9295;

// Basic static file server
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
  if (filePath.endsWith(path.sep) || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
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
  console.log(`Static server running on http://127.0.0.1:${PORT}`);

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
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Test 1: Home 1 (index.html)
  console.log('Navigating to Home 1 (index.html)...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  // Capture Home 1 Light Mode
  const shot1Light = await send('Page.captureScreenshot', { format: 'png' });
  const shot1LightPath = path.join(artifactDir, 'home1_money_hero_light.png');
  fs.writeFileSync(shot1LightPath, Buffer.from(shot1Light.data, 'base64'));
  console.log('Saved Home 1 Light screenshot:', shot1LightPath);

  // Switch to Home 1 Dark Mode
  await send('Runtime.evaluate', { expression: `RetireWellApp.toggleTheme();` });
  await new Promise(r => setTimeout(r, 1000));
  const shot1Dark = await send('Page.captureScreenshot', { format: 'png' });
  const shot1DarkPath = path.join(artifactDir, 'home1_money_hero_dark.png');
  fs.writeFileSync(shot1DarkPath, Buffer.from(shot1Dark.data, 'base64'));
  console.log('Saved Home 1 Dark screenshot:', shot1DarkPath);

  // Test 2: Home 2 (home-2.html)
  console.log('Navigating to Home 2 (home-2.html)...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/home-2.html` });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure Light Mode first
  await send('Runtime.evaluate', {
    expression: `if (document.documentElement.classList.contains('dark')) RetireWellApp.toggleTheme();`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot2Light = await send('Page.captureScreenshot', { format: 'png' });
  const shot2LightPath = path.join(artifactDir, 'home2_money_hero_light.png');
  fs.writeFileSync(shot2LightPath, Buffer.from(shot2Light.data, 'base64'));
  console.log('Saved Home 2 Light screenshot:', shot2LightPath);

  // Switch to Home 2 Dark Mode
  await send('Runtime.evaluate', { expression: `RetireWellApp.toggleTheme();` });
  await new Promise(r => setTimeout(r, 1000));
  const shot2Dark = await send('Page.captureScreenshot', { format: 'png' });
  const shot2DarkPath = path.join(artifactDir, 'home2_money_hero_dark.png');
  fs.writeFileSync(shot2DarkPath, Buffer.from(shot2Dark.data, 'base64'));
  console.log('Saved Home 2 Dark screenshot:', shot2DarkPath);

  chrome.kill();
  server.close();
  console.log('Verification completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during verification:', err);
  try { server.close(); } catch (_) {}
  process.exit(1);
});
