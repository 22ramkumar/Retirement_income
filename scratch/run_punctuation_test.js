const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function main() {
  const fileUrl = 'file:///' + path.resolve(__dirname, 'test_punctuation.html').replace(/\\/g, '/');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9277',
    '--window-size=1000,1000',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9277/json/list', res => {
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
    throw new Error('Failed to connect to Chrome on port 9277');
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
  await new Promise(r => setTimeout(r, 1200));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'punctuation_comparison.png'), Buffer.from(snap.data, 'base64'));

  const evaluation = await send('Runtime.evaluate', {
    expression: `
      (() => {
        function getSymbolPosition(elId, symbolChar) {
          const el = document.getElementById(elId);
          if (!el) return null;
          const range = document.createRange();
          const textNode = el.childNodes[0];
          const text = textNode.textContent;
          const idx = text.indexOf(symbolChar);
          if (idx === -1) return null;
          range.setStart(textNode, idx);
          range.setEnd(textNode, idx + 1);
          const rect = range.getBoundingClientRect();
          const parentRect = el.getBoundingClientRect();
          return {
            id: elId,
            symbol: symbolChar,
            symbolX: Math.round(rect.x),
            parentLeft: Math.round(parentRect.x),
            parentRight: Math.round(parentRect.x + parentRect.width),
            side: (rect.x > (parentRect.x + parentRect.width / 2)) ? 'RIGHT' : 'LEFT'
          };
        }

        return [
          getSymbolPosition('m1_dot', '.'),
          getSymbolPosition('m1_colon', ':'),
          getSymbolPosition('m1_star', '*'),
          getSymbolPosition('m2_dot', '.'),
          getSymbolPosition('m2_colon', ':'),
          getSymbolPosition('m2_star', '*'),
          getSymbolPosition('m3_dot', '.'),
          getSymbolPosition('m3_colon', ':'),
          getSymbolPosition('m3_star', '*')
        ];
      })()
    `,
    returnByValue: true
  });

  console.log('Results:', JSON.stringify(evaluation.result.value, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
