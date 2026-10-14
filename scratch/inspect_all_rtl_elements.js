const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspect(url) {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9290',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9290/json/list', res => {
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
    throw new Error('Failed to connect to Chrome on port 9290');
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

  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 1500));

  await send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('dir', 'rtl');`
  });
  await new Promise(r => setTimeout(r, 800));

  const report = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const out = [];

        // Check advisor stars in advisors.html or index.html
        document.querySelectorAll('.bi-star-fill').forEach(star => {
          const p = star.parentElement;
          const sR = star.getBoundingClientRect();
          const pR = p.getBoundingClientRect();
          out.push({
            type: 'star',
            parentText: p.textContent.trim().substring(0, 30),
            starX: Math.round(sR.x),
            parentX: Math.round(pR.x),
            parentWidth: Math.round(pR.width),
            isRightSideOfParent: sR.x > (pR.x + pR.width / 2)
          });
        });

        // Check mandatory symbols (*)
        document.querySelectorAll('label').forEach(lbl => {
          if (lbl.textContent.includes('*')) {
            const lR = lbl.getBoundingClientRect();
            // find where the * is
            const range = document.createRange();
            const textNodes = [];
            function findTextNodes(node) {
              if (node.nodeType === 3) textNodes.push(node);
              else node.childNodes.forEach(findTextNodes);
            }
            findTextNodes(lbl);
            for (const tn of textNodes) {
              const idx = tn.textContent.indexOf('*');
              if (idx !== -1) {
                range.setStart(tn, idx);
                range.setEnd(tn, idx + 1);
                const starRect = range.getBoundingClientRect();
                out.push({
                  type: 'mandatory_star',
                  label: lbl.textContent.trim().substring(0, 30),
                  starX: Math.round(starRect.x),
                  labelX: Math.round(lR.x),
                  labelRight: Math.round(lR.x + lR.width),
                  isRightSideOfLabel: starRect.x > (lR.x + lR.width / 2)
                });
                break;
              }
            }
          }
        });

        // Check fullstops in p elements
        document.querySelectorAll('p').forEach(p => {
          const txt = p.textContent.trim();
          if (txt.endsWith('.') && txt.length > 20 && p.offsetHeight > 0) {
            const pR = p.getBoundingClientRect();
            const range = document.createRange();
            const lastChild = p.childNodes[p.childNodes.length - 1];
            if (lastChild && lastChild.nodeType === 3) {
              const idx = lastChild.textContent.lastIndexOf('.');
              if (idx !== -1) {
                range.setStart(lastChild, idx);
                range.setEnd(lastChild, idx + 1);
                const dotRect = range.getBoundingClientRect();
                out.push({
                  type: 'fullstop',
                  text: txt.substring(txt.length - 25),
                  dotX: Math.round(dotRect.x),
                  parentRight: Math.round(pR.x + pR.width),
                  parentLeft: Math.round(pR.x),
                  position: dotRect.x > (pR.x + pR.width / 2) ? 'RIGHT' : 'LEFT'
                });
              }
            }
          }
        });

        return JSON.stringify({
          stars: out.filter(x => x.type === 'star').slice(0, 6),
          mandatory: out.filter(x => x.type === 'mandatory_star').slice(0, 6),
          fullstops: out.filter(x => x.type === 'fullstop').slice(0, 6)
        }, null, 2);
      })()
    `,
    returnByValue: true
  });

  console.log('Results for ' + url + ':');
  console.log(report.result.value);

  ws.close();
  chrome.kill();
}

async function run() {
  const indexUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  await inspect(indexUrl);
  process.exit(0);
}

run().catch(console.error);
