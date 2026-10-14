const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function captureFooter() {
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9271',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9271/json/list', res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const targets = JSON.parse(d);
                const p = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension:')) || targets[0];
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
    throw new Error('Failed to connect to Chrome on port 9271');
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
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to footer
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 800));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'new_footer_format_verified.png'), Buffer.from(snap.data, 'base64'));
  console.log('Saved new_footer_format_verified.png');

  // Also capture dark mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.classList.add('dark');
      document.documentElement.style.scrollBehavior = 'auto';
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 800));
  const darkSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'new_footer_dark_verified.png'), Buffer.from(darkSnap.data, 'base64'));
  console.log('Saved new_footer_dark_verified.png');

  // Also capture in RTL mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.style.scrollBehavior = 'auto';
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'start' });
    `
  });
  await new Promise(r => setTimeout(r, 800));
  const rtlSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'new_footer_rtl_verified.png'), Buffer.from(rtlSnap.data, 'base64'));
  console.log('Saved new_footer_rtl_verified.png');

  ws.close();
  chrome.kill();
}

captureFooter().catch(console.error);
