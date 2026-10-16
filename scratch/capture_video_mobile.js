const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5545;
const DEBUG_PORT = 9325;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith(path.sep) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
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
    '--window-size=375,812',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const target = await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}/json/list`, res => {
      let d = ''; res.on('data', chunk => d += chunk);
      res.on('end', () => {
        const list = JSON.parse(d);
        resolve(list.find(t => t.type === 'page') || list[0]);
      });
    });
  });

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      cb(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise(r => {
      const msgId = id++;
      pending.set(msgId, r);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, 900);'
  });
  await new Promise(r => setTimeout(r, 600));

  const ss = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(artifactDir, 'video_current_mobile.png'), Buffer.from(ss.data, 'base64'));

  chrome.kill();
  server.close();
  console.log('Saved video_current_mobile.png');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
