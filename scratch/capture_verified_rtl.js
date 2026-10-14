const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function testPage(fileRel, outName, modalTrigger, options = {}) {
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', fileRel).replace(/\\/g, '/');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9298',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9298/json/list', res => {
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
        await new Promise(r => setTimeout(r, 400));
      }
    }
    throw new Error('Failed to connect to Chrome on port 9298');
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
  await new Promise(r => setTimeout(r, 800));
  await send('Runtime.evaluate', { expression: "localStorage.clear();" });
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1200));

  if (options.rtl) {
    await send('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('dir', 'rtl');`
    });
  } else {
    await send('Runtime.evaluate', {
      expression: `document.documentElement.removeAttribute('dir');`
    });
  }

  if (options.dark) {
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('retirewell_theme', 'dark');
      `
    });
  }

  await new Promise(r => setTimeout(r, 400));

  if (modalTrigger) {
    await send('Runtime.evaluate', { expression: modalTrigger });
    await new Promise(r => setTimeout(r, 600));
  }

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, outName), Buffer.from(snap.data, 'base64'));

  ws.close();
  chrome.kill();
  console.log(`Captured ${outName}`);
}

async function run() {
  const footerScroll = `
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    const footer = document.querySelector('footer');
    if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'start' });
  `;

  await testPage('index.html', 'new_footer_light.png', footerScroll, { rtl: false });
  await testPage('index.html', 'new_footer_dark.png', footerScroll, { rtl: false, dark: true });
  await testPage('index.html', 'new_footer_rtl.png', footerScroll, { rtl: true });
}

run().catch(console.error);
