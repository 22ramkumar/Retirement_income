const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5546;
const DEBUG_PORT = 9326;

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

  // 1. Inspect index.html
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 1000));

  const indexStats = await send('Runtime.evaluate', {
    expression: `JSON.stringify((() => {
      const hero = document.querySelector('section');
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const leftCol = hero ? hero.querySelector('.lg\\\\:col-span-7') : null;
      const rightCol = hero ? hero.querySelector('.lg\\\\:col-span-5') : null;
      const videoCont = hero ? hero.querySelector('.aspect-\\\\[4\\\\/5\\\\]') : null;
      const badgesCont = hero ? hero.querySelector('.grid-cols-1.sm\\\\:grid-cols-3') : null;
      return {
        heroHeight: heroRect ? Math.round(heroRect.height) : 0,
        leftColHeight: leftCol ? Math.round(leftCol.getBoundingClientRect().height) : 0,
        rightColHeight: rightCol ? Math.round(rightCol.getBoundingClientRect().height) : 0,
        videoHeight: videoCont ? Math.round(videoCont.getBoundingClientRect().height) : 0,
        badgesHeight: badgesCont ? Math.round(badgesCont.getBoundingClientRect().height) : 0,
      };
    })())`
  });

  console.log('INDEX.HTML HERO STATS:', indexStats.result.value);

  // 2. Inspect home-2.html
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/home-2.html` });
  await new Promise(r => setTimeout(r, 1000));

  const home2Stats = await send('Runtime.evaluate', {
    expression: `JSON.stringify((() => {
      const hero = document.querySelector('section');
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const leftCol = hero ? hero.querySelector('.lg\\\\:col-span-7') : null;
      const rightCol = hero ? hero.querySelector('.lg\\\\:col-span-5') : null;
      const estimator = document.getElementById('quickEstimator');
      return {
        heroHeight: heroRect ? Math.round(heroRect.height) : 0,
        leftColHeight: leftCol ? Math.round(leftCol.getBoundingClientRect().height) : 0,
        rightColHeight: rightCol ? Math.round(rightCol.getBoundingClientRect().height) : 0,
        estimatorHeight: estimator ? Math.round(estimator.getBoundingClientRect().height) : 0
      };
    })())`
  });

  console.log('HOME-2.HTML HERO STATS:', home2Stats.result.value);

  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
