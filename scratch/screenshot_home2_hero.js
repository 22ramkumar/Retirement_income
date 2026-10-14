const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\30e878ba-dc4c-4db7-a3a9-a3461d23c3f2';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  function getPageTarget() {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9225/json/list', res => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          const targets = JSON.parse(d);
          const page = targets.find(t => t.type === 'page') || targets[0];
          resolve(page);
        });
      }).on('error', reject);
    });
  }

  const target = await getPageTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Runtime.enable');

  // Load home-2.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/home-2.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure Light Mode and scroll to top
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      window.scrollTo(0, 0);
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Light Theme Hero
  const screenshotLight = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotLight && screenshotLight.data) {
    const outPath = path.join(artifactDir, 'home2_hero_light_theme.png');
    fs.writeFileSync(outPath, Buffer.from(screenshotLight.data, 'base64'));
    console.log('Saved Light Theme Hero screenshot to:', outPath);
  }

  // Switch to Dark Mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      window.scrollTo(0, 0);
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Dark Theme Hero
  const screenshotDark = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotDark && screenshotDark.data) {
    const outPath = path.join(artifactDir, 'home2_hero_dark_theme.png');
    fs.writeFileSync(outPath, Buffer.from(screenshotDark.data, 'base64'));
    console.log('Saved Dark Theme Hero screenshot to:', outPath);
  }

  ws.close();
  chrome.kill();
  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
