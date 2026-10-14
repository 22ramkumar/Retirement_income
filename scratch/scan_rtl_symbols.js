const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPage(url) {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9234/json/list', res => {
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
    throw new Error('Failed to connect to Chrome on port 9234');
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
  await new Promise(r => setTimeout(r, 600));

  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const issues = [];
        // Check all icons that have text beside them
        const icons = document.querySelectorAll('i[class*="bi"]');
        icons.forEach(icon => {
          // If icon is hidden or inside an invisible element, skip
          if (icon.offsetParent === null && icon.offsetWidth === 0) return;
          const parent = icon.parentElement;
          if (!parent) return;

          // Check if parent has text content (excluding other icons)
          const text = parent.innerText ? parent.innerText.trim() : '';
          if (!text || text.length === 0) return;

          // Get icon bounding box
          const iRect = icon.getBoundingClientRect();
          // Find text siblings or parent's first text node
          // Let's check where the text sits
          const siblingSpan = Array.from(parent.children).find(c => c !== icon && (c.tagName === 'SPAN' || c.tagName === 'DIV' || c.tagName === 'P'));
          let textX = null;
          let textLabel = '';
          if (siblingSpan) {
            const sRect = siblingSpan.getBoundingClientRect();
            textX = sRect.x;
            textLabel = siblingSpan.innerText.trim();
          }

          // If icon and text are side by side:
          // In RTL, standard reading order has symbol on the RIGHT of the text (iRect.x > textX)
          // Let's flag any where icon is on the LEFT of the text (iRect.x < textX)
          if (textX !== null && textLabel.length > 0) {
            // Check if icon is to the left of text
            if (iRect.x + iRect.width <= textX + 5) {
              issues.push({
                iconClass: icon.className,
                text: textLabel.substring(0, 30),
                parentTag: parent.tagName,
                parentClass: parent.className.substring(0, 40),
                iconX: Math.round(iRect.x),
                textX: Math.round(textX),
                position: 'ICON_ON_LEFT'
              });
            }
          }
        });

        // Also check input currency symbols
        document.querySelectorAll('.relative > span.absolute, .relative > span').forEach(sp => {
          if (sp.textContent.trim() === '$') {
            const inp = sp.parentElement.querySelector('input');
            if (inp) {
              const spRect = sp.getBoundingClientRect();
              const inpRect = inp.getBoundingClientRect();
              if (spRect.x < inpRect.x + inpRect.width / 2) {
                issues.push({
                  type: 'CURRENCY_INPUT_SYMBOL',
                  id: inp.id,
                  dollarX: Math.round(spRect.x),
                  inpRight: Math.round(inpRect.x + inpRect.width),
                  position: 'DOLLAR_ON_LEFT'
                });
              }
            }
          }
        });

        return JSON.stringify(issues, null, 2);
      })()
    `
  });

  console.log('Issues on ' + url + ':');
  console.log(result.result.value);

  ws.close();
  chrome.kill();
}

async function run() {
  await testPage('http://127.0.0.1:5500/index.html');
  await testPage('http://127.0.0.1:5500/home-2.html');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
