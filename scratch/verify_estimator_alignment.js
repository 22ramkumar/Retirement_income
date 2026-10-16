const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5591;
const DEBUG_PORT = 9391;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith(path.sep) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(filePath, 'index.html');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function main() {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const target = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}/json/list`, res => {
      let d = ''; res.on('data', chunk => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)[0]));
    }).on('error', reject);
  });

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const mid = id++;
    const handler = e => {
      const d = JSON.parse(e.data);
      if (d.id === mid) { ws.removeEventListener('message', handler); r(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  // Test at 375px mobile and 320px
  for (const w of [375, 320, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 2,
      mobile: w < 768
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 800));

    // Scroll directly to the estimator widget and set test value
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.getElementById('estimatorWidget');
          if (el) el.scrollIntoView({ block: 'center' });
          const floor = document.getElementById('homeResultFloor');
          if (floor) floor.textContent = '$5,427/mo';
          
          // Check collision between floor text and badge
          const badge = document.querySelector('.rw-badge-teal:has-text, span.rw-badge-teal');
          const floorRect = floor ? floor.getBoundingClientRect() : null;
          return {
            floorRect: floorRect ? { top: floorRect.top, bottom: floorRect.bottom, left: floorRect.left, right: floorRect.right } : null
          };
        })()
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 300));

    // Capture screenshot of the estimator section
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, `estimator_alignment_${w}px.png`), Buffer.from(shot.data, 'base64'));
    console.log(`✓ Captured estimator alignment screenshot at ${w}px`);
  }

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(console.error);
