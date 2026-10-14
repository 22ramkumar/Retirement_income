const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1440,960',
    '--disable-gpu',
    '--no-sandbox'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  async function getTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9288/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9288');
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

  console.log('Navigating to http://127.0.0.1:5500/index.html...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 3000));

  // Inspect video element status
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const v = document.getElementById('heroBgVideo');
      return {
        found: !!v,
        currentSrc: v ? v.currentSrc : null,
        paused: v ? v.paused : null,
        currentTime: v ? v.currentTime : null,
        videoWidth: v ? v.videoWidth : null,
        videoHeight: v ? v.videoHeight : null,
        readyState: v ? v.readyState : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Hero Bg Video State:', JSON.stringify(evalRes.result ? evalRes.result.value : evalRes));

  // Screenshot light mode
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const shot1Path = path.join(artifactDir, 'hero_bg_video_light.png');
  fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
  console.log('Saved light mode screenshot:', shot1Path);

  // Switch to dark mode
  await send('Runtime.evaluate', {
    expression: `RetireWellApp.toggleTheme();`
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const shot2Path = path.join(artifactDir, 'hero_bg_video_dark.png');
  fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
  console.log('Saved dark mode screenshot:', shot2Path);

  chrome.kill();
  process.exit(0);
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
