const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const DEBUG_PORT = 9498;

async function run() {
  console.log('--- TESTING CLIENT LOGIN PORTAL BUTTON ABOVE HOME 1 IN MOBILE DRAWER ---');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=375,812',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  const cleanup = () => {
    try { chrome.kill(); } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

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
      } catch (e) {}
      await new Promise(r => setTimeout(r, 300));
    }
    throw new Error('Target not found');
  }

  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      if (msg.error) {
        console.error('CDP Error:', msg.error);
        pending.get(msg.id)(null);
      } else {
        pending.get(msg.id)(msg.result);
      }
      pending.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res && res.result ? res.result.value : null;
  }

  // 1. Navigate to index.html (logged out)
  console.log('\n1. Navigating to index.html (Logged out)...');
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
  await new Promise(r => setTimeout(r, 1200));

  // Ensure logged out in local session
  await evalJs(`
    if (window.RetireWellDB) window.RetireWellDB.logout();
    localStorage.removeItem('retirewell_session');
    location.reload();
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Open mobile drawer
  console.log('Opening mobile drawer...');
  await evalJs(`
    const btn = document.getElementById('mobileMenuBtn');
    if (btn) btn.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Verify DOM elements and order
  const checkLoggedOut = await evalJs(`
    (function() {
      const drawer = document.getElementById('mobileDrawer');
      if (!drawer) return { error: 'Drawer not found' };

      const loginBtn = drawer.querySelector('a[href="login.html"]');
      const home1Link = drawer.querySelector('a[href="index.html"]');

      // Check position: loginBtn should appear before home1Link in DOM tree
      let isAboveHome1 = false;
      if (loginBtn && home1Link) {
        const position = loginBtn.compareDocumentPosition(home1Link);
        // Node.DOCUMENT_POSITION_FOLLOWING is 4
        isAboveHome1 = (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      }

      return {
        drawerVisible: !drawer.classList.contains('translate-x-full'),
        hasLoginBtn: !!loginBtn,
        loginBtnText: loginBtn ? loginBtn.innerText.trim() : null,
        hasHome1Link: !!home1Link,
        home1Text: home1Link ? home1Link.innerText.trim() : null,
        isLoginAboveHome1: isAboveHome1
      };
    })()
  `);
  console.log('Drawer Check (Logged Out):', JSON.stringify(checkLoggedOut, null, 2));

  // Capture screenshot of mobile drawer with Client Login Portal button above Home 1
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'drawer_client_login_above_home1.png'), Buffer.from(snap1.data, 'base64'));
  console.log('Saved drawer_client_login_above_home1.png');

  // 2. Now log in and check logged-in view
  console.log('\n2. Logging in and checking drawer in logged-in state...');
  await evalJs(`
    if (window.RetireWellDB) {
      window.RetireWellDB.login('user@gmail.com', '1234');
      location.reload();
    }
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Open drawer again
  await evalJs(`
    const btn = document.getElementById('mobileMenuBtn');
    if (btn) btn.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const checkLoggedIn = await evalJs(`
    (function() {
      const drawer = document.getElementById('mobileDrawer');
      const userBox = drawer.querySelector('a[href="user.html"]');
      const home1Link = drawer.querySelector('a[href="index.html"]');
      let isAboveHome1 = false;
      if (userBox && home1Link) {
        const position = userBox.compareDocumentPosition(home1Link);
        isAboveHome1 = (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      }
      return {
        hasUserBox: !!userBox,
        userBoxText: userBox ? userBox.innerText.trim() : null,
        isAboveHome1
      };
    })()
  `);
  console.log('Drawer Check (Logged In):', JSON.stringify(checkLoggedIn, null, 2));

  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'drawer_loggedin_above_home1.png'), Buffer.from(snap2.data, 'base64'));
  console.log('Saved drawer_loggedin_above_home1.png');

  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
  ws.close();
  cleanup();
  process.exit(0);
}

run().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
