const { spawn } = require('child_process');

async function runTest() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const listRes = await fetch('http://127.0.0.1:9223/json/list').then(r => r.json());
  const wsUrl = listRes[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, params = {}) => {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method: m, params }));
    return new Promise(resolve => {
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === msgId) {
          ws.removeEventListener('message', h);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
    });
  };

  const logs = [];
  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push({ type: 'EXCEPTION', data: msg.params.exceptionDetails });
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      // console.log
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  const pages = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html'];

  for (const page of pages) {
    console.log(`\n======================================================`);
    console.log(`Testing: http://127.0.0.1:5500/${page}`);
    console.log(`======================================================`);

    await send('Page.navigate', { url: `http://127.0.0.1:5500/${page}` });
    await new Promise(r => setTimeout(r, 1500));

    // Get count of buttons
    const btnsInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button')).map((b, idx) => ({
          idx,
          id: b.id,
          text: (b.innerText || b.getAttribute('title') || b.id || '').trim().replace(/\\s+/g, ' ').slice(0, 40),
          onclick: b.getAttribute('onclick') || '',
          disabled: b.disabled
        }));
        return {
          title: document.title,
          buttonCount: buttons.length,
          buttons
        };
      })()`,
      returnByValue: true
    });

    const info = btnsInfo.result?.value;
    console.log(`Page Title: "${info?.title}" | Found ${info?.buttonCount} buttons`);

    // Let's test all buttons
    for (const b of (info?.buttons || [])) {
      logs.length = 0;
      // Do not click submit buttons directly to prevent unexpected page navigation or reload
      const isSubmit = await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('button')[${b.idx}]?.type === 'submit'`
      });

      if (isSubmit.result?.value) {
        console.log(`  [SKIP SUBMIT] #${b.idx}: "${b.text}" (type=submit)`);
        continue;
      }

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelectorAll('button')[${b.idx}];
          if (!btn) return { missing: true };
          try {
            btn.click();
            return { ok: true };
          } catch(e) {
            return { error: e.message };
          }
        })()`,
        returnByValue: true
      });

      if (logs.length > 0) {
        console.log(`  ❌ [EXCEPTION] #${b.idx}: "${b.text}" onclick="${b.onclick}":`, logs.map(l => l.data?.text || l.data?.exception?.description));
      } else if (res.result?.value?.error) {
        console.log(`  ❌ [ERROR] #${b.idx}: "${b.text}":`, res.result.value.error);
      } else {
        console.log(`  ✓ #${b.idx}: "${b.text}"`);
      }

      // Close any opened modal so it doesn't block future clicks
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.rw-modal-backdrop.active').forEach(m => m.classList.remove('active')); document.body.style.overflow = '';`
      });
    }
  }

  ws.close();
  chrome.kill();
  console.log('\nAudit complete.');
}

runTest().catch(console.error);
