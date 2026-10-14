const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\30e878ba-dc4c-4db7-a3a9-a3461d23c3f2';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9226/json/list', res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const targets = JSON.parse(d);
                const p = targets.find(t => t.type === 'page') || targets[0];
                resolve(p);
              } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
        if (page && page.webSocketDebuggerUrl) return page;
      } catch (e) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    throw new Error('Failed to connect to Chrome on port 9224');
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

  // Load index.html in Light Mode
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure Light Mode and scroll to footer
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Light Theme Footer
  const screenshotLight = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotLight && screenshotLight.data) {
    const outPath = path.join(artifactDir, 'footer_light_theme.png');
    fs.writeFileSync(outPath, Buffer.from(screenshotLight.data, 'base64'));
    console.log('Saved Light Theme footer screenshot to:', outPath);
  }

  // Switch to Dark Mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Dark Theme Footer
  const screenshotDark = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotDark && screenshotDark.data) {
    const outPath = path.join(artifactDir, 'footer_dark_theme.png');
    fs.writeFileSync(outPath, Buffer.from(screenshotDark.data, 'base64'));
    console.log('Saved Dark Theme footer screenshot to:', outPath);
  }

  ws.close();
  chrome.kill();
  console.log('Finished capturing screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
