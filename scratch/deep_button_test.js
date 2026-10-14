const { spawn } = require('child_process');

async function testAllButtons() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-deep-' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pages = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html'];

  for (const pageName of pages) {
    console.log(`\n======================================================`);
    console.log(`PAGE: ${pageName}`);
    console.log(`======================================================`);

    const url = `http://127.0.0.1:5500/${pageName}`;
    const newPage = await fetch(`http://127.0.0.1:9222/json/new?${url}`, { method: 'PUT' });
    const target = await newPage.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

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
    await send('Page.enable');

    // Wait until document.readyState === 'complete'
    for (let k = 0; k < 20; k++) {
      const r = await send('Runtime.evaluate', { expression: 'document.readyState' });
      if (r.result?.value === 'complete') break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 600));

    // Get all buttons on the page
    const btnsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        return Array.from(document.querySelectorAll('button')).map((b, i) => {
          return {
            index: i,
            text: (b.innerText || b.getAttribute('title') || b.getAttribute('aria-label') || b.id || '').trim().replace(/\\s+/g, ' ').slice(0, 50),
            id: b.id,
            onclick: b.getAttribute('onclick') || '',
            classes: b.className
          };
        });
      })()`,
      returnByValue: true
    });

    const buttons = btnsRes.result?.value || [];
    console.log(`Found ${buttons.length} buttons on ${pageName}. Testing each...`);

    for (const b of buttons) {
      exceptions.length = 0; // reset
      const clickRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelectorAll('button')[${b.index}];
          if (!btn) return { notFound: true };
          
          // Record state before click
          const modalsBefore = Array.from(document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active, [id$="Modal"]:not(.hidden)')).map(m => m.id);
          const sectionsBefore = document.querySelector('main > section:not(.hidden)')?.id;
          
          try {
            btn.click();
          } catch(err) {
            return { error: err.message, stack: err.stack };
          }
          
          // Record state after click
          const modalsAfter = Array.from(document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active, [id$="Modal"]:not(.hidden)')).map(m => m.id);
          const sectionsAfter = document.querySelector('main > section:not(.hidden)')?.id;
          
          return {
            modalsBefore,
            modalsAfter,
            sectionsBefore,
            sectionsAfter
          };
        })()`,
        returnByValue: true
      });

      if (exceptions.length > 0) {
        console.error(`❌ [EXCEPTION on click] Button #${b.index} ("${b.text}", onclick="${b.onclick}"):`, exceptions.map(e => e.text + ' ' + (e.exception?.description || '')));
      } else if (clickRes.result?.value?.error) {
        console.error(`❌ [ERROR on click] Button #${b.index} ("${b.text}"):`, clickRes.result.value.error);
      } else {
        const val = clickRes.result?.value;
        const modalChanged = JSON.stringify(val?.modalsBefore) !== JSON.stringify(val?.modalsAfter);
        const sectionChanged = val?.sectionsBefore !== val?.sectionsAfter;
        // If modal was opened, close it so next button isn't obscured
        if (val?.modalsAfter && val.modalsAfter.length > 0) {
          await send('Runtime.evaluate', {
            expression: `document.querySelectorAll('.rw-modal-backdrop.active, [id$="Modal"].active').forEach(m => m.classList.remove('active'));`
          });
        }
      }
    }

    ws.close();
  }

  chrome.kill();
  console.log('\n======================================================\nALL PAGES TESTED!\n======================================================');
}

testAllButtons();
