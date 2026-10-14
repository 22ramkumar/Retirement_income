const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9232/json/list', res => {
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
    throw new Error('Failed to connect to Chrome on port 9232');
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

  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 1500));

  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('dir', 'rtl');
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const report = [];
        // Check cards with checkmarks (Fiduciary Oath, Zero Surprises, etc.)
        document.querySelectorAll('.bi-check2').forEach(icon => {
          const parent = icon.parentElement;
          const iconRect = icon.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          const textSpan = parent.querySelector('span');
          const spanRect = textSpan ? textSpan.getBoundingClientRect() : null;
          report.push({
            parentText: parent.textContent.trim(),
            iconX: Math.round(iconRect.x),
            spanX: spanRect ? Math.round(spanRect.x) : null,
            iconIsRightOfSpan: spanRect ? (iconRect.x > spanRect.x) : 'N/A'
          });
        });

        // Check currency inputs
        document.querySelectorAll('input#homeInputCurrent, input#homeInputMonthly').forEach(inp => {
          const parent = inp.parentElement;
          const dollar = parent.querySelector('span');
          const dollarRect = dollar ? dollar.getBoundingClientRect() : null;
          const inpRect = inp.getBoundingClientRect();
          report.push({
            input: inp.id,
            dollarX: dollarRect ? Math.round(dollarRect.x) : null,
            inpX: Math.round(inpRect.x),
            inpWidth: Math.round(inpRect.width),
            dollarIsRightSideOfInput: dollarRect ? (dollarRect.x > inpRect.x + inpRect.width / 2) : false
          });
        });

        return JSON.stringify(report, null, 2);
      })()
    `
  });

  console.log('RTL Inspection Report:');
  console.log(result.result.value);

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
