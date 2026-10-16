const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const rootDir = path.resolve(__dirname, '..');
const PORT = 5580;
const DEBUG_PORT = 9380;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith(path.sep) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function main() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Test server running at http://127.0.0.1:${PORT}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function getTarget() {
    for (let i = 0; i < 20; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${DEBUG_PORT}/json/list`, res => {
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
    throw new Error('Could not connect to Chrome debugging port');
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
  await send('DOM.enable');

  const pages = [
    'index.html',
    'home-2.html',
    'services.html',
    'advisors.html',
    'about.html',
    'login.html',
    'user.html'
  ];

  const breakpoints = [
    { name: 'Desktop-1440', width: 1440, height: 900, mobile: false },
    { name: 'Desktop-1280', width: 1280, height: 800, mobile: false },
    { name: 'Desktop-1024', width: 1024, height: 768, mobile: false },
    { name: 'Tablet-912',   width: 912,  height: 1368, mobile: true },
    { name: 'Tablet-834',   width: 834,  height: 1194, mobile: true },
    { name: 'Tablet-768',   width: 768,  height: 1024, mobile: true },
    { name: 'Mobile-480',   width: 480,  height: 854, mobile: true },
    { name: 'Mobile-430',   width: 430,  height: 932, mobile: true },
    { name: 'Mobile-414',   width: 414,  height: 896, mobile: true },
    { name: 'Mobile-390',   width: 390,  height: 844, mobile: true },
    { name: 'Mobile-375',   width: 375,  height: 667, mobile: true },
    { name: 'Mobile-320',   width: 320,  height: 568, mobile: true }
  ];

  console.log('\n======================================================');
  console.log('1. AUDITING ALL PAGES ACROSS 12 DEVICE BREAKPOINTS');
  console.log('======================================================');

  let totalTests = 0;
  let totalPass = 0;

  for (const page of pages) {
    for (const bp of breakpoints) {
      totalTests++;
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 1,
        mobile: bp.mobile
      });

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
      await new Promise(r => setTimeout(r, 600));

      // Inject auth if user.html
      if (page === 'user.html') {
        await send('Runtime.evaluate', {
          expression: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));`
        });
      }

      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docEl = document.documentElement;
            const scrollW = docEl.scrollWidth;
            const clientW = docEl.clientWidth;
            const winW = window.innerWidth;
            const hasHScroll = scrollW > clientW;
            
            // Collect any elements overflowing the right boundary
            const overflowElements = [];
            document.querySelectorAll('body *').forEach(el => {
              if (['SCRIPT','STYLE','LINK','META','HEAD','BR'].includes(el.tagName)) return;
              if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
              if (el.closest('.rw-modal-backdrop:not(.active)')) return;
              
              // If an ancestor has overflow:hidden/clip/scroll/auto and that ancestor fits inside winW,
              // then the element is visually clipped or horizontally scrollable inside its container.
              let isClipped = false;
              let parent = el.parentElement;
              while (parent && parent !== document.body && parent !== document.documentElement) {
                const style = window.getComputedStyle(parent);
                const ox = style.overflowX;
                const oy = style.overflowY;
                if (['hidden', 'clip', 'auto', 'scroll'].includes(ox) || ['hidden', 'clip', 'auto', 'scroll'].includes(oy)) {
                  const pr = parent.getBoundingClientRect();
                  if (pr.right <= winW + 2) {
                    isClipped = true;
                    break;
                  }
                }
                parent = parent.parentElement;
              }
              if (isClipped) return;

              const rect = el.getBoundingClientRect();
              if (rect.right > winW + 2) {
                overflowElements.push({
                  tag: el.tagName,
                  id: el.id,
                  cls: (el.className && el.className.toString) ? el.className.toString().substring(0, 30) : '',
                  right: Math.round(rect.right),
                  excess: Math.round(rect.right - winW)
                });
              }
            });

            return {
              scrollW,
              clientW,
              winW,
              hasHScroll,
              overflowCount: overflowElements.length,
              overflowSample: overflowElements.slice(0, 2)
            };
          })()
        `,
        returnByValue: true
      });

      const data = res.result ? res.result.value : res.value;
      if (!data.hasHScroll && data.overflowCount === 0) {
        totalPass++;
      } else {
        console.log(`❌ FAIL [${page} @ ${bp.name} (${bp.width}px)]: scrollW=${data.scrollW}, clientW=${data.clientW}, overflowCount=${data.overflowCount}`);
        if (data.overflowSample && data.overflowSample.length > 0) {
          console.log(`   Overflow elements:`, JSON.stringify(data.overflowSample));
        }
      }
    }
    console.log(`  ✓ Checked ${page} across all 12 breakpoints.`);
  }

  console.log(`Page Responsive Audit Summary: ${totalPass}/${totalTests} Passed (100% = ${totalPass === totalTests})`);

  console.log('\n======================================================');
  console.log('2. AUDITING ALL MODAL POPUPS AT 320px & 375px');
  console.log('======================================================');

  const modalTests = [
    { page: 'index.html', modalId: 'bookingModal', openFn: "RetireWellApp.openBookingModal('Fixed Annuities');" },
    { page: 'index.html', modalId: 'disclaimersModal', openFn: "RetireWellApp.openDisclaimersModal();" },
    { page: 'services.html', modalId: 'serviceDetailModal', openFn: "openServiceDetailModal('fixed');" },
    { page: 'advisors.html', modalId: 'advisorBioModal', openFn: "openAdvisorModal('david');" },
    { page: 'user.html', modalId: 'statementDetailModal', openFn: "openStatementModal('RW-2026-Q1');" },
    { page: 'user.html', modalId: 'beneficiaryModal', openFn: "openAddBeneficiaryModal();" },
    { page: 'user.html', modalId: 'uploadDocModal', openFn: "openUploadDocModal();" }
  ];

  for (const t of modalTests) {
    for (const width of [320, 375]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 667,
        deviceScaleFactor: 1,
        mobile: true
      });

      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${t.page}` });
      await new Promise(r => setTimeout(r, 600));

      if (t.page === 'user.html') {
        await send('Runtime.evaluate', {
          expression: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));`
        });
        await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${t.page}` });
        await new Promise(r => setTimeout(r, 600));
      }

      // Ensure footer / scripts are loaded
      await send('Runtime.evaluate', {
        expression: `
          if (!document.getElementById('${t.modalId}')) {
            // Wait for footer to mount if needed
            const f = document.getElementById('footer');
            if (f && typeof renderFooterModals === 'function') renderFooterModals();
          }
        `
      });

      await send('Runtime.evaluate', { expression: t.openFn });
      await new Promise(r => setTimeout(r, 400));

      const modalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modal = document.getElementById('${t.modalId}');
            if (!modal) return { exists: false, error: 'Element #${t.modalId} not found' };
            const dialog = modal.querySelector('.rw-modal-dialog');
            if (!dialog) return { exists: false, error: 'Dialog inside #${t.modalId} not found' };
            
            const r = dialog.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const fitsH = r.left >= 0 && r.right <= winW + 1;
            const overflowsRight = r.right > winW;
            const hasActive = modal.classList.contains('active');

            return {
              exists: true,
              active: hasActive,
              dialogWidth: Math.round(r.width),
              dialogLeft: Math.round(r.left),
              dialogRight: Math.round(r.right),
              winW,
              fitsH,
              overflowsRight
            };
          })()
        `,
        returnByValue: true
      });

      const mData = modalRes.result ? modalRes.result.value : modalRes.value;
      if (mData.exists && mData.fitsH) {
        console.log(`  ✅ Modal [${t.modalId} @ ${width}px]: Width=${mData.dialogWidth}px (Left: ${mData.dialogLeft}px, Right: ${mData.dialogRight}px) Fits perfectly inside viewport`);
      } else {
        console.log(`  ❌ Modal [${t.modalId} @ ${width}px]:`, JSON.stringify(mData));
      }
    }
  }

  console.log('\n======================================================');
  console.log('3. AUDITING NOTIFICATION PANEL IN user.html AT 320px');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: true
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/user.html` });
  await new Promise(r => setTimeout(r, 600));
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));`
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/user.html` });
  await new Promise(r => setTimeout(r, 600));

  await send('Runtime.evaluate', { expression: `toggleNotificationPanel();` });
  await new Promise(r => setTimeout(r, 300));

  const notifEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const panel = document.getElementById('notifPanel');
        if (!panel) return { exists: false };
        const r = panel.getBoundingClientRect();
        return {
          exists: true,
          panelWidth: Math.round(r.width),
          left: Math.round(r.left),
          right: Math.round(r.right),
          winW: window.innerWidth,
          fits: r.left >= 0 && r.right <= window.innerWidth + 1
        };
      })()
    `,
    returnByValue: true
  });
  const notifData = notifEval.result ? notifEval.result.value : notifEval.value;
  if (notifData.exists && notifData.fits) {
    console.log(`  ✅ Notif Panel @ 320px: Width=${notifData.panelWidth}px (Left: ${notifData.left}px, Right: ${notifData.right}px) Fits inside 320px viewport`);
  } else {
    console.log(`  ❌ Notif Panel @ 320px:`, JSON.stringify(notifData));
  }

  console.log('\n======================================================');
  console.log('4. AUDITING TOAST NOTIFICATIONS AT 320px');
  console.log('======================================================');

  await send('Runtime.evaluate', {
    expression: `RetireWellApp.toast('Your multi-year guaranteed annuity allocation blueprint has been registered in the Fiduciary System vault.', 'success');`
  });
  await new Promise(r => setTimeout(r, 300));

  const toastEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const toast = document.querySelector('.toast-item');
        if (!toast) return { exists: false };
        const r = toast.getBoundingClientRect();
        return {
          exists: true,
          toastWidth: Math.round(r.width),
          left: Math.round(r.left),
          right: Math.round(r.right),
          winW: window.innerWidth,
          fits: r.left >= 0 && r.right <= window.innerWidth + 1
        };
      })()
    `,
    returnByValue: true
  });
  const toastData = toastEval.result ? toastEval.result.value : toastEval.value;
  if (toastData.exists && toastData.fits) {
    console.log(`  ✅ Toast @ 320px: Width=${toastData.toastWidth}px (Left: ${toastData.left}px, Right: ${toastData.right}px) Fits inside 320px viewport`);
  } else {
    console.log(`  ❌ Toast @ 320px:`, JSON.stringify(toastData));
  }

  console.log('\n======================================================');
  console.log('5. AUDITING RTL LAYOUT ACROSS ALL BREAKPOINTS');
  console.log('======================================================');

  for (const page of ['index.html', 'home-2.html', 'services.html', 'advisors.html', 'about.html', 'login.html', 'user.html']) {
    for (const width of [1440, 768, 375, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 700,
        deviceScaleFactor: 1,
        mobile: width <= 768
      });
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
      await new Promise(r => setTimeout(r, 600));

      if (page === 'user.html') {
        await send('Runtime.evaluate', {
          expression: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));`
        });
        await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${page}` });
        await new Promise(r => setTimeout(r, 600));
      }

      await send('Runtime.evaluate', {
        expression: `document.documentElement.setAttribute('dir', 'rtl'); document.body.setAttribute('dir', 'rtl');`
      });
      await new Promise(r => setTimeout(r, 300));

      const rtlEval = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docEl = document.documentElement;
            return {
              scrollW: docEl.scrollWidth,
              clientW: docEl.clientWidth,
              hasHScroll: docEl.scrollWidth > docEl.clientWidth
            };
          })()
        `,
        returnByValue: true
      });
      const rtlData = rtlEval.result ? rtlEval.result.value : rtlEval.value;
      if (!rtlData.hasHScroll) {
        console.log(`  ✅ RTL [${page} @ ${width}px]: Perfect fit (scrollW=${rtlData.scrollW}, clientW=${rtlData.clientW})`);
      } else {
        console.log(`  ❌ RTL [${page} @ ${width}px]: Horizontal scrollbar detected (scrollW=${rtlData.scrollW}, clientW=${rtlData.clientW})`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('6. CAPTURING REPRESENTATIVE VISUAL EVIDENCE');
  console.log('======================================================');

  const screenshots = [
    { page: 'index.html', width: 375, height: 812, name: 'responsive_375_home1.png' },
    { page: 'home-2.html', width: 375, height: 812, name: 'responsive_375_home2.png' },
    { page: 'services.html', width: 375, height: 812, name: 'responsive_375_services.png' },
    { page: 'advisors.html', width: 375, height: 812, name: 'responsive_375_advisors.png' },
    { page: 'about.html', width: 375, height: 812, name: 'responsive_375_about.png' },
    { page: 'login.html', width: 375, height: 812, name: 'responsive_375_login.png' },
    { page: 'user.html', width: 375, height: 812, name: 'responsive_375_user.png', setup: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));` },
    { page: 'index.html', width: 320, height: 568, name: 'responsive_320_booking_modal.png', modal: "RetireWellApp.openBookingModal('Fixed Annuities');" },
    { page: 'services.html', width: 320, height: 568, name: 'responsive_320_service_modal.png', modal: "openServiceDetailModal('fixed');" },
    { page: 'user.html', width: 320, height: 568, name: 'responsive_320_statement_modal.png', setup: `localStorage.setItem('retirewell_auth', JSON.stringify({ name: 'Robert Vance', email: 'client@example.com', token: 'mock-auth' }));`, modal: "openStatementModal('RW-2026-Q1');" }
  ];

  for (const s of screenshots) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.width,
      height: s.height,
      deviceScaleFactor: 2,
      mobile: true
    });

    if (s.setup) {
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${s.page}` });
      await new Promise(r => setTimeout(r, 400));
      await send('Runtime.evaluate', { expression: s.setup });
    }

    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${s.page}` });
    await new Promise(r => setTimeout(r, 800));

    if (s.modal) {
      await send('Runtime.evaluate', { expression: s.modal });
      await new Promise(r => setTimeout(r, 500));
    }

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, s.name);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`  ✓ Saved screenshot: ${s.name}`);
  }

  console.log('\nAll comprehensive tests and visual captures completed successfully!');
  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
