const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9284',
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
          http.get('http://127.0.0.1:9284/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9284');
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
  await send('Runtime.enable');

  // 1. Load login page (Sign In tab)
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/login.html?switch=true' });
  await new Promise(r => setTimeout(r, 1500));

  // Explicitly ensure video starts playing and seek slightly to a sunny wave frame
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const v = document.getElementById('portalBgVideo');
        if (v) {
          v.muted = true;
          v.currentTime = 2.5;
          v.play().catch(() => {});
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const vidState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const v = document.getElementById('portalBgVideo');
        return {
          currentSrc: v ? v.currentSrc : null,
          currentTime: v ? v.currentTime : null,
          paused: v ? v.paused : null,
          videoWidth: v ? v.videoWidth : null,
          videoHeight: v ? v.videoHeight : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Video state at capture:', vidState.result.value);

  const loginSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'video_bg_login_portal.png'), Buffer.from(loginSnap.data, 'base64'));
  console.log('Saved video_bg_login_portal.png');

  // 2. Switch to Sign Up (Register Client)
  await send('Runtime.evaluate', { expression: "switchAuthTab('register')" });
  await new Promise(r => setTimeout(r, 500));
  const signupSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'video_bg_signup_portal.png'), Buffer.from(signupSnap.data, 'base64'));
  console.log('Saved video_bg_signup_portal.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(e => {
  console.error(e);
  process.exit(1);
});
