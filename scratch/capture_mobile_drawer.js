const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5597;
const DEBUG_PORT = 9397;

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
    '--window-size=375,812',
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
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 800));

  // Click the mobile hamburger button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('mobileMenuBtn');
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'mobile_hamburger_drawer_reduced.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved mobile_hamburger_drawer_reduced.png');

  // Close the drawer
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.getElementById('closeMobileDrawer');
        if (closeBtn) closeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  // Scroll to guaranteedFloorCard and set $5,427/mo
  const clip = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const floor = document.getElementById('homeResultFloor');
        if (floor) floor.textContent = '$5,427/mo';
        const card = document.getElementById('guaranteedFloorCard');
        if (!card) return null;
        card.scrollIntoView({ block: 'center' });
        const r = card.getBoundingClientRect();
        return { x: Math.max(0, r.left - 8), y: r.top - 8, width: r.width + 16, height: r.height + 16 };
      })()
    `,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 400));

  const floorShot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: clip.result && clip.result.value ? clip.result.value : undefined
  });
  fs.writeFileSync(path.join(artifactDir, 'floor_card_final.png'), Buffer.from(floorShot.data, 'base64'));
  console.log('Saved floor_card_final.png');

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(console.error);
