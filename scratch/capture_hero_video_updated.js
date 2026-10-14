const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function capture() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9285',
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
          http.get('http://127.0.0.1:9285/json/list', res => {
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
    throw new Error('Could not connect to Chrome 9285');
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

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure video is playing and check its state
  const vidStatus = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const v = document.getElementById('heroStoryVideo');
        if (v) {
          v.muted = true;
          v.currentTime = 1.0;
          v.play().catch(() => {});
        }
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
  console.log('Hero video status:', vidStatus.result.value);

  // Capture full hero view
  const heroSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'updated_hero_video_full.png'), Buffer.from(heroSnap.data, 'base64'));
  console.log('Saved updated_hero_video_full.png');

  // Also clip the hero video container specifically
  const clipRect = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('heroStoryVideo').closest('.relative.mx-auto.max-w-md, .lg\\:col-span-5');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: Math.max(0, r.x - 20),
          y: Math.max(0, r.y - 20),
          width: r.width + 40,
          height: r.height + 40,
          scale: 1
        };
      })()
    `,
    returnByValue: true
  });

  if (clipRect.result.value) {
    const croppedSnap = await send('Page.captureScreenshot', {
      format: 'png',
      clip: clipRect.result.value
    });
    fs.writeFileSync(path.join(artifactDir, 'updated_hero_video_container.png'), Buffer.from(croppedSnap.data, 'base64'));
    console.log('Saved updated_hero_video_container.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(e => {
  console.error(e);
  process.exit(1);
});
