const fs = require('fs');
const { spawn } = require('child_process');

const pages = [
  'index.html',
  'services.html',
  'advisors.html',
  'login.html',
  'user.html'
];

async function runAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-audit-' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const allIssues = [];

  for (const pageName of pages) {
    console.log(`\n========================================\nAUDITING: ${pageName}\n========================================`);
    try {
      const url = `http://127.0.0.1:5500/${pageName}`;
      const res = await fetch(`http://127.0.0.1:9222/json/new?${url}`, { method: 'PUT' });
      const page = await res.json();
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
      });

      let msgId = 1;
      const send = (method, params = {}) => {
        const id = msgId++;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve) => {
          const handler = (evt) => {
            const data = JSON.parse(evt.data);
            if (data.id === id) {
              ws.removeEventListener('message', handler);
              resolve(data.result);
            }
          };
          ws.addEventListener('message', handler);
        });
      };

      const consoleErrors = [];
      ws.addEventListener('message', (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          consoleErrors.push('EXCEPTION: ' + JSON.stringify(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || '')));
        }
      });

      await send('Runtime.enable');
      await send('Page.enable');

      // Wait 1s for load
      await new Promise(r => setTimeout(r, 1500));

      // 1. Check initial console errors
      if (consoleErrors.length > 0) {
        console.log(`[${pageName}] Page Load Errors:`, consoleErrors);
        allIssues.push({ page: pageName, type: 'Page Load Error', details: consoleErrors.slice() });
      } else {
        console.log(`[${pageName}] Clean load: 0 console errors.`);
      }

      // 2. Inspect all buttons and links
      const inspectRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const buttons = Array.from(document.querySelectorAll('button')).map((b, i) => ({
            index: i,
            text: b.innerText.trim().slice(0, 40),
            id: b.id || '',
            className: b.className || '',
            onclick: b.getAttribute('onclick') || '',
            type: b.getAttribute('type') || 'button',
            disabled: b.disabled,
            visible: b.offsetParent !== null
          }));

          const links = Array.from(document.querySelectorAll('a')).map((a, i) => ({
            index: i,
            text: a.innerText.trim().slice(0, 40),
            href: a.getAttribute('href') || '',
            onclick: a.getAttribute('onclick') || '',
            target: a.getAttribute('target') || ''
          }));

          return { buttons, links };
        })()`,
        returnByValue: true
      });

      const { buttons, links } = inspectRes.result.value;
      console.log(`[${pageName}] Found ${buttons.length} buttons and ${links.length} links.`);

      // Check dead links href="#"
      const deadLinks = links.filter(l => (l.href === '#' || l.href === '') && !l.onclick);
      if (deadLinks.length > 0) {
        console.log(`[${pageName}] WARNING: ${deadLinks.length} links with empty or '#' href and no onclick:`);
        deadLinks.forEach(l => console.log(`   - "${l.text}" (href="${l.href}")`));
        allIssues.push({ page: pageName, type: 'Dead Link', links: deadLinks });
      }

      // Check buttons for missing onclick or clicking them
      console.log(`[${pageName}] Testing clicks on all buttons...`);
      for (const btn of buttons) {
        // Skip submit buttons inside forms that might navigate away, or test them carefully
        const clickResult = await send('Runtime.evaluate', {
          expression: `(() => {
            const b = document.querySelectorAll('button')[${btn.index}];
            if (!b) return { ok: false, msg: 'not found' };
            // If it's a submit button or inside form, prevent real page reload
            let error = null;
            const originalError = window.onerror;
            try {
              // Click
              b.click();
            } catch (err) {
              error = err.message + ' \\n ' + err.stack;
            }
            return {
              ok: !error,
              error: error
            };
          })()`,
          returnByValue: true
        });

        if (clickResult.result.value.error) {
          console.error(`[${pageName}] ERROR clicking button "${btn.text}" (id="${btn.id}"):`, clickResult.result.value.error);
          allIssues.push({ page: pageName, type: 'Button Click Exception', btn, error: clickResult.result.value.error });
        }
      }

      // Check if any new console errors appeared during button clicking
      if (consoleErrors.length > 0) {
        console.log(`[${pageName}] Console errors accumulated during button tests:`, consoleErrors);
        allIssues.push({ page: pageName, type: 'Runtime Errors on Interaction', errors: consoleErrors });
      }

      ws.close();
    } catch (e) {
      console.error(`Error auditing ${pageName}:`, e);
    }
  }

  chrome.kill();
  console.log('\n========================================\nAUDIT COMPLETE\n========================================');
  console.log('Total issues found:', allIssues.length);
  fs.writeFileSync('scratch/audit_results.json', JSON.stringify(allIssues, null, 2));
}

runAudit();
