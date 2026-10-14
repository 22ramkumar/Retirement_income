const { spawn } = require('child_process');

async function testAllPagesLive() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9245;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pages = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html'];

  for (const page of pages) {
    console.log(`\n======================================================`);
    console.log(`PAGE: ${page}`);
    console.log(`======================================================`);

    const newTab = await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5500/${page}`, { method: 'PUT' }).then(r => r.json());
    const ws = new WebSocket(newTab.webSocketDebuggerUrl);

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

    const exceptions = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
    });

    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1200));

    // For login.html: if we want to stay on login.html, clear session and reload
    if (page === 'login.html') {
      await send('Runtime.evaluate', {
        expression: `localStorage.setItem('retirewell_session', JSON.stringify({ isLoggedIn: false, user: null })); window.location.reload();`
      });
      await new Promise(r => setTimeout(r, 1200));
    }

    const res = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        title: document.title,
        buttonCount: document.querySelectorAll('button').length,
        buttons: Array.from(document.querySelectorAll('button')).map((b, i) => ({
          index: i,
          text: (b.innerText || b.getAttribute('title') || b.id || '').trim().replace(/\\s+/g, ' ').slice(0, 45),
          id: b.id,
          onclick: b.getAttribute('onclick') || '',
          type: b.type
        }))
      })`,
      returnByValue: true
    });

    const pageData = JSON.parse(res.result.value);
    console.log(`Title: "${pageData.title}" | Buttons: ${pageData.buttonCount}`);

    let passedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const b of pageData.buttons) {
      if (b.type === 'submit') {
        skippedCount++;
        continue;
      }

      exceptions.length = 0;

      const clickRes = await send('Runtime.evaluate', {
        expression: `JSON.stringify((() => {
          const btn = document.querySelectorAll('button')[${b.index}];
          if (!btn) return { missing: true };

          // Record modal / active state before
          const activeModalsBefore = Array.from(document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active')).map(m => m.id);
          const activeSecBefore = document.querySelector('main > section:not(.hidden)')?.id;

          try {
            btn.click();
          } catch(err) {
            return { error: err.message };
          }

          const activeModalsAfter = Array.from(document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active')).map(m => m.id);
          const activeSecAfter = document.querySelector('main > section:not(.hidden)')?.id;

          return {
            ok: true,
            activeModalsBefore,
            activeModalsAfter,
            activeSecBefore,
            activeSecAfter
          };
        })())`,
        returnByValue: true
      });

      const clickVal = JSON.parse(clickRes.result.value);

      if (exceptions.length > 0) {
        failedCount++;
        console.error(`  ❌ [EXCEPTION] #${b.index} "${b.text}" (onclick="${b.onclick}"):`, exceptions.map(e => e.text + ' ' + (e.exception?.description || '')));
      } else if (clickVal.error) {
        failedCount++;
        console.error(`  ❌ [ERROR] #${b.index} "${b.text}":`, clickVal.error);
      } else {
        passedCount++;
        const modalOpened = clickVal.activeModalsAfter.filter(m => !clickVal.activeModalsBefore.includes(m));
        const sectionChanged = clickVal.activeSecBefore !== clickVal.activeSecAfter;
        let changeStr = '';
        if (modalOpened.length > 0) changeStr = ` -> Opened modal [${modalOpened.join(', ')}]`;
        if (sectionChanged) changeStr += ` -> Switched section [${clickVal.activeSecAfter}]`;
        console.log(`  ✓ #${b.index} "${b.text}"${changeStr}`);
      }

      // Close modal if opened to avoid obscuring future clicks
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active').forEach(m => m.classList.remove('active')); document.body.style.overflow = '';`
      });
    }

    console.log(`Summary for ${page}: ${passedCount} passed, ${skippedCount} submit-skipped, ${failedCount} failed.`);
    ws.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${newTab.id}`);
  }

  chrome.kill();
  console.log('\n================ ALL TESTED ================');
}

testAllPagesLive().catch(console.error);
