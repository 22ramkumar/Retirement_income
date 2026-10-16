const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(403);
      res.end('Directory listing forbidden');
    }
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);

  const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const CDP_PORT = 9223;

  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    '--user-data-dir=' + path.join(ROOT, 'scratch', 'chrome_device_profile')
  ]);

  await new Promise(r => setTimeout(r, 2000));

  async function getWsUrl() {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const list = await res.json();
    return list[0].webSocketDebuggerUrl;
  }

  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

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
    { name: 'Desktop-1440', width: 1440, height: 900 },
    { name: 'Desktop-1280', width: 1280, height: 800 },
    { name: 'Desktop-1024', width: 1024, height: 768 },
    { name: 'Tablet-912',   width: 912,  height: 1368 },
    { name: 'Tablet-834',   width: 834,  height: 1194 },
    { name: 'Tablet-768',   width: 768,  height: 1024 },
    { name: 'Mobile-480',   width: 480,  height: 854 },
    { name: 'Mobile-430',   width: 430,  height: 932 },
    { name: 'Mobile-414',   width: 414,  height: 896 },
    { name: 'Mobile-390',   width: 390,  height: 844 },
    { name: 'Mobile-375',   width: 375,  height: 667 },
    { name: 'Mobile-320',   width: 320,  height: 568 }
  ];

  const results = {
    pagesAudit: {},
    modalAudit: {},
    toastAudit: {},
    rtlAudit: {},
    notifPanelAudit: {}
  };

  console.log('\n--- 1. AUDITING ALL PAGES ACROSS 12 BREAKPOINTS ---');

  for (const page of pages) {
    results.pagesAudit[page] = {};
    for (const bp of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 1,
        mobile: bp.width <= 768
      });

      await send('Page.navigate', { url: `http://localhost:${PORT}/${page}` });
      await new Promise(r => setTimeout(r, 600));

      const evaluation = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docEl = document.documentElement;
            const scrollW = docEl.scrollWidth;
            const clientW = docEl.clientWidth;
            const hasHScroll = scrollW > clientW;
            
            // Check elements overflowing right edge
            const overflowing = [];
            document.querySelectorAll('body *').forEach(el => {
              if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
              const r = el.getBoundingClientRect();
              if (r.right > window.innerWidth + 1.5 || r.left < -1.5) {
                // Ignore fixed modals that are hidden
                if (el.closest('.rw-modal-backdrop:not(.active)')) return;
                overflowing.push({
                  tag: el.tagName,
                  id: el.id,
                  cls: el.className ? el.className.toString().substring(0, 40) : '',
                  right: Math.round(r.right),
                  left: Math.round(r.left),
                  windowWidth: window.innerWidth
                });
              }
            });

            return {
              scrollW,
              clientW,
              hasHScroll,
              overflowCount: overflowing.length,
              sampleOverflow: overflowing.slice(0, 3)
            };
          })()
        `,
        returnByValue: true
      });

      results.pagesAudit[page][bp.name] = evaluation.result.value;
      const status = evaluation.result.value.hasHScroll ? '❌ SCROLLBAR' : '✅ FIT';
      if (evaluation.result.value.hasHScroll || evaluation.result.value.overflowCount > 0) {
        console.log(`[${page} @ ${bp.name} (${bp.width}px)]: ${status} (overflows: ${evaluation.result.value.overflowCount})`);
      }
    }
    console.log(`  ✓ Checked ${page} across all 12 breakpoints.`);
  }

  console.log('\n--- 2. AUDITING MODALS AT 320px & 375px VIEWPORTS ---');
  const modalTests = [
    { page: 'index.html', modalId: 'bookingModal', openCode: "RetireWellApp.openBookingModal('Fixed Annuities');" },
    { page: 'index.html', modalId: 'disclaimersModal', openCode: "RetireWellApp.openDisclaimersModal();" },
    { page: 'services.html', modalId: 'serviceDetailModal', openCode: "openServiceDetailModal('fixed');" },
    { page: 'advisors.html', modalId: 'advisorBioModal', openCode: "openAdvisorModal('david');" },
    { page: 'user.html', modalId: 'statementDetailModal', openCode: "openStatementDetailModal('RW-2026-Q1');" },
    { page: 'user.html', modalId: 'beneficiaryModal', openCode: "openBeneficiaryModal();" },
    { page: 'user.html', modalId: 'uploadDocModal', openCode: "openUploadDocModal();" }
  ];

  for (const t of modalTests) {
    for (const width of [320, 375]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 667,
        deviceScaleFactor: 1,
        mobile: true
      });

      await send('Page.navigate', { url: `http://localhost:${PORT}/${t.page}` });
      await new Promise(r => setTimeout(r, 600));

      await send('Runtime.evaluate', { expression: t.openCode });
      await new Promise(r => setTimeout(r, 300));

      const modalCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modal = document.getElementById('${t.modalId}');
            if (!modal) return { exists: false };
            const dialog = modal.querySelector('.rw-modal-dialog');
            const r = dialog ? dialog.getBoundingClientRect() : modal.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const fitsH = r.left >= 0 && r.right <= winW + 1;
            const overflowsH = r.width > winW;
            return {
              exists: true,
              active: modal.classList.contains('active'),
              dialogWidth: Math.round(r.width),
              dialogLeft: Math.round(r.left),
              dialogRight: Math.round(r.right),
              winW,
              fitsH,
              overflowsH
            };
          })()
        `,
        returnByValue: true
      });

      const key = `${t.modalId}_${width}px`;
      results.modalAudit[key] = modalCheck.result.value;
      console.log(`  Modal [${t.modalId} @ ${width}px]: Width=${modalCheck.result.value.dialogWidth}px, FitsH=${modalCheck.result.value.fitsH ? '✅ YES' : '❌ NO'}`);
    }
  }

  console.log('\n--- 3. AUDITING NOTIFICATION PANEL IN user.html AT 320px ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 1,
    mobile: true
  });
  await send('Page.navigate', { url: `http://localhost:${PORT}/user.html` });
  await new Promise(r => setTimeout(r, 600));
  await send('Runtime.evaluate', { expression: `toggleNotificationPanel();` });
  await new Promise(r => setTimeout(r, 300));

  const notifCheck = await send('Runtime.evaluate', {
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
          fits: r.left >= 0 && r.right <= window.innerWidth + 1
        };
      })()
    `,
    returnByValue: true
  });
  results.notifPanelAudit = notifCheck.result.value;
  console.log(`  Notif Panel @ 320px: Width=${notifCheck.result.value.panelWidth}px, Fits=${notifCheck.result.value.fits ? '✅ YES' : '❌ NO'}`);

  console.log('\n--- 4. AUDITING TOAST NOTIFICATIONS AT 320px ---');
  await send('Runtime.evaluate', {
    expression: `RetireWellApp.toast('Your multi-year guaranteed annuity allocation blueprint has been registered in the Fiduciary System vault.', 'success');`
  });
  await new Promise(r => setTimeout(r, 300));
  const toastCheck = await send('Runtime.evaluate', {
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
          fits: r.left >= 0 && r.right <= window.innerWidth + 1
        };
      })()
    `,
    returnByValue: true
  });
  results.toastAudit = toastCheck.result.value;
  console.log(`  Toast @ 320px: Width=${toastCheck.result.value.toastWidth}px, Fits=${toastCheck.result.value.fits ? '✅ YES' : '❌ NO'}`);

  console.log('\n--- 5. AUDITING RTL ACROSS BREAKPOINTS ---');
  for (const page of ['index.html', 'home-2.html', 'user.html', 'services.html']) {
    results.rtlAudit[page] = {};
    for (const width of [1440, 768, 375, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 800,
        deviceScaleFactor: 1,
        mobile: width <= 768
      });
      await send('Page.navigate', { url: `http://localhost:${PORT}/${page}` });
      await new Promise(r => setTimeout(r, 600));
      await send('Runtime.evaluate', { expression: `document.documentElement.setAttribute('dir', 'rtl'); document.body.setAttribute('dir', 'rtl');` });
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
      results.rtlAudit[page][`${width}px`] = rtlEval.result.value;
      const status = rtlEval.result.value.hasHScroll ? '❌ SCROLL' : '✅ FIT';
      console.log(`  RTL [${page} @ ${width}px]: ${status}`);
    }
  }

  // Save audit results to file
  fs.writeFileSync(path.join(ROOT, 'scratch', 'comprehensive_device_results.json'), JSON.stringify(results, null, 2));

  // Capture representative screenshots for user report
  console.log('\n--- 6. CAPTURING REPRESENTATIVE SCREENSHOTS ---');
  const shots = [
    { page: 'index.html', width: 375, height: 812, name: 'mobile_375_home1.png' },
    { page: 'home-2.html', width: 375, height: 812, name: 'mobile_375_home2.png' },
    { page: 'services.html', width: 375, height: 812, name: 'mobile_375_services.png' },
    { page: 'advisors.html', width: 375, height: 812, name: 'mobile_375_advisors.png' },
    { page: 'user.html', width: 375, height: 812, name: 'mobile_375_dashboard.png' },
    { page: 'login.html', width: 375, height: 812, name: 'mobile_375_login.png' },
    { page: 'index.html', width: 320, height: 568, name: 'mobile_320_home1.png', modal: "RetireWellApp.openBookingModal('Fixed MYGA');" },
    { page: 'services.html', width: 320, height: 568, name: 'mobile_320_service_modal.png', modal: "openServiceDetailModal('fixed');" },
    { page: 'user.html', width: 320, height: 568, name: 'mobile_320_statement_modal.png', modal: "openStatementDetailModal('RW-2026-Q1');" }
  ];

  for (const s of shots) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.width,
      height: s.height,
      deviceScaleFactor: 1,
      mobile: true
    });
    await send('Page.navigate', { url: `http://localhost:${PORT}/${s.page}` });
    await new Promise(r => setTimeout(r, 600));
    if (s.modal) {
      await send('Runtime.evaluate', { expression: s.modal });
      await new Promise(r => setTimeout(r, 400));
    }
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ROOT, 'scratch', s.name), Buffer.from(shot.data, 'base64'));
    console.log(`  ✓ Captured ${s.name}`);
  }

  console.log('\nAll tests complete! Exiting.');
  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
});
