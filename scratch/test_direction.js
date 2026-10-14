const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9238',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9238/json/list', res => {
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
    throw new Error('Failed to connect to Chrome on port 9238');
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
  await new Promise(r => setTimeout(r, 600));

  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const report = [];

        // 1. Check buttons (e.g. Plan My Retirement)
        document.querySelectorAll('button.btn-primary-gold').forEach(btn => {
          const icon = btn.querySelector('i');
          if (!icon) return;
          const iR = icon.getBoundingClientRect();
          const bR = btn.getBoundingClientRect();
          report.push({
            el: 'btn-primary-gold: ' + btn.textContent.trim(),
            btnX: Math.round(bR.x),
            btnWidth: Math.round(bR.width),
            iconX: Math.round(iR.x),
            iconOnRightSide: iR.x > (bR.x + bR.width / 2)
          });
        });

        // 2. Check cards (Fiduciary Oath, etc.)
        document.querySelectorAll('.bi-check2').forEach(icon => {
          const p = icon.parentElement;
          const s = p.querySelector('span');
          if (!s) return;
          const iR = icon.getBoundingClientRect();
          const sR = s.getBoundingClientRect();
          report.push({
            el: 'Card check: ' + p.textContent.trim(),
            iconX: Math.round(iR.x),
            spanX: Math.round(sR.x),
            iconOnRightSide: iR.x > sR.x
          });
        });

        // 3. Check currency inputs
        ['homeSavings', 'homeMonthlyContrib'].forEach(id => {
          const inp = document.getElementById(id);
          if (!inp) return;
          const p = inp.parentElement;
          const dollar = p.querySelector('span');
          const dR = dollar.getBoundingClientRect();
          const inR = inp.getBoundingClientRect();
          report.push({
            el: 'Currency input: ' + id,
            dollarX: Math.round(dR.x),
            inpX: Math.round(inR.x),
            inpWidth: Math.round(inR.width),
            dollarOnRightSide: dR.x > (inR.x + inR.width / 2)
          });
        });

        return JSON.stringify(report, null, 2);
      })()
    `
  });

  console.log('Result:', result.result.value);
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(console.error);
