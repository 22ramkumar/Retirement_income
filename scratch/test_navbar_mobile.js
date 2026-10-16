const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5535;
const DEBUG_PORT = 9315;

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

  for (const w of [360, 375, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 750, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', { expression: 'document.fonts.ready' });
    await new Promise(r => setTimeout(r, 500));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const logo = document.querySelector('header a[aria-label="RetireWell Homepage"]');
        const themeBtn = document.querySelector('header button[title="Theme"]');
        const menuBtn = document.getElementById('mobileMenuBtn');
        const subtitle = logo ? logo.querySelector('span:nth-child(2)') : null;
        return {
          logoRect: logo ? logo.getBoundingClientRect() : null,
          subtitleRect: subtitle ? subtitle.getBoundingClientRect() : null,
          themeRect: themeBtn ? themeBtn.getBoundingClientRect() : null,
          menuRect: menuBtn ? menuBtn.getBoundingClientRect() : null,
          isOverlapping: (logo && themeBtn) ? (logo.getBoundingClientRect().right > themeBtn.getBoundingClientRect().left) : false
        };
      })()`,
      returnByValue: true
    });

    console.log(`Width ${w}px result:`, JSON.stringify(check.value, null, 2));

    const ss = await send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: w, height: 90, scale: 2 }
    });
    fs.writeFileSync(path.join(artifactDir, `navbar_${w}.png`), Buffer.from(ss.data, 'base64'));

    if (w === 375) {
      await send('Runtime.evaluate', { expression: "document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.classList.add('dark');" });
      await new Promise(r => setTimeout(r, 400));
      const ssDark = await send('Page.captureScreenshot', {
        clip: { x: 0, y: 0, width: w, height: 90, scale: 2 }
      });
      fs.writeFileSync(path.join(artifactDir, `navbar_375_dark.png`), Buffer.from(ssDark.data, 'base64'));
    }
  }

  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
