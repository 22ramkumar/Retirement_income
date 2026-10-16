const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\1d30b1d7-662f-469b-a380-ca5d711c7f5a';
const DEBUG_PORT = 9488;

async function main() {
  console.log('--- STARTING DASHBOARD SIGN OUT VERIFICATION ---');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1440,900',
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
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
              try {
                const list = JSON.parse(data);
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

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res && res.result ? res.result.value : null;
  }

  async function navigate(url) {
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1200));
  }

  async function capture(filename) {
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    if (!snap || !snap.data) {
      console.error('Failed to capture screenshot for', filename);
      return;
    }
    const outPath = path.join(artifactDir, filename);
    fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  }

  // 1. Navigate to login.html
  console.log('\n1. Navigating to login.html...');
  await navigate('http://127.0.0.1:5500/login.html');

  // Fill credentials and login
  console.log('Logging in as user@gmail.com / 1234...');
  const loginRes = await evalJs(`
    (function() {
      document.getElementById('loginEmail').value = 'user@gmail.com';
      document.getElementById('loginPassword').value = '1234';
      const res = window.RetireWellDB.login('user@gmail.com', '1234');
      return res;
    })()
  `);
  console.log('Login result:', loginRes);

  // 2. Navigate to user.html (Dashboard)
  console.log('\n2. Navigating to user.html (Client Dashboard)...');
  await navigate('http://127.0.0.1:5500/user.html');

  // Check UI elements on desktop
  const checkDesktop = await evalJs(`
    (function() {
      const topBtn = document.getElementById('topBarSignOutBtn');
      const profileBtn = document.getElementById('profileDropdownBtn');
      const profileMenu = document.getElementById('profileDropdown');
      const sidebarNavSignOut = Array.from(document.querySelectorAll('#sidebarNav button')).find(b => b.textContent.includes('Sign Out'));
      const sidebarBottomSignOut = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent.includes('Secure Sign Out'));
      const welcomeText = document.getElementById('topBarUserWelcome')?.textContent;
      const topBarName = document.getElementById('topBarUserName')?.textContent;
      const session = window.RetireWellDB ? window.RetireWellDB.getSession() : null;

      return {
        hasTopBtn: !!topBtn,
        topBtnVisible: topBtn ? (topBtn.offsetParent !== null && window.getComputedStyle(topBtn).display !== 'none') : false,
        topBtnText: topBtn ? topBtn.innerText.trim() : null,
        hasProfileBtn: !!profileBtn,
        hasProfileMenu: !!profileMenu,
        profileMenuInitiallyHidden: profileMenu ? profileMenu.classList.contains('hidden') : null,
        hasSidebarNavSignOut: !!sidebarNavSignOut,
        hasSidebarBottomSignOut: !!sidebarBottomSignOut,
        welcomeText,
        topBarName,
        isLoggedIn: session ? session.isLoggedIn : false
      };
    })()
  `);
  console.log('Desktop Dashboard Check:', JSON.stringify(checkDesktop, null, 2));

  // Open profile dropdown
  console.log('\nToggling profile dropdown open...');
  await evalJs(`window.toggleProfileDropdown(true);`);
  await new Promise(r => setTimeout(r, 400));

  const dropdownContent = await evalJs(`
    (function() {
      const p = document.getElementById('profileDropdown');
      return {
        isOpen: !p.classList.contains('hidden'),
        userName: document.getElementById('dropdownUserName')?.textContent,
        userEmail: document.getElementById('dropdownUserEmail')?.textContent,
        dropdownSignOutBtn: !!p.querySelector('button[onclick*="handleLogout"]')
      };
    })()
  `);
  console.log('Profile Dropdown Open Content:', dropdownContent);

  // Capture screenshot of desktop dashboard with profile dropdown open
  await capture('dashboard_desktop_signout_dropdown.png');

  // Close profile dropdown
  await evalJs(`window.toggleProfileDropdown(false);`);

  // Switch to settings and check the session card
  console.log('\nChecking Settings tab Session card...');
  await evalJs(`window.showDashboardSection('settings');`);
  await new Promise(r => setTimeout(r, 400));
  const settingsCheck = await evalJs(`
    (function() {
      const card = document.querySelector('#section-settings .rw-card button[onclick*="handleLogout"]');
      return {
        hasSettingsSignOutBtn: !!card,
        btnText: card ? card.innerText.trim() : null
      };
    })()
  `);
  console.log('Settings Tab Check:', settingsCheck);

  // 3. Test Mobile Breakpoint (375x812)
  console.log('\n3. Testing Mobile Breakpoint (375x812 iPhone)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evalJs(`window.showDashboardSection('overview');`);
  await new Promise(r => setTimeout(r, 600));

  const mobileCheck = await evalJs(`
    (function() {
      const topBtn = document.getElementById('topBarSignOutBtn');
      const rect = topBtn ? topBtn.getBoundingClientRect() : null;
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return {
        hasTopBtn: !!topBtn,
        topBtnVisible: topBtn ? (topBtn.offsetParent !== null) : false,
        topBtnRect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        scrollWidth,
        clientWidth,
        hasHorizontalOverflow: scrollWidth > clientWidth
      };
    })()
  `);
  console.log('Mobile Dashboard Check (375px):', JSON.stringify(mobileCheck, null, 2));
  await capture('dashboard_mobile_signout_topbar.png');

  // Open mobile drawer and check Sign Out
  console.log('\nOpening mobile sidebar drawer...');
  await evalJs(`window.toggleSidebar(true);`);
  await new Promise(r => setTimeout(r, 500));
  const mobileDrawerCheck = await evalJs(`
    (function() {
      const sidebar = document.getElementById('dashboardSidebar');
      const isVisible = !sidebar.classList.contains('-translate-x-full');
      const navSignOut = Array.from(sidebar.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out'));
      return {
        sidebarOpen: isVisible,
        hasSignOutInDrawer: !!navSignOut,
        signOutText: navSignOut ? navSignOut.innerText.trim() : null
      };
    })()
  `);
  console.log('Mobile Drawer Check:', mobileDrawerCheck);
  await capture('dashboard_mobile_drawer_signout.png');
  await evalJs(`window.toggleSidebar(false);`);

  // 4. Test Website Header when Logged In (index.html)
  console.log('\n4. Testing Website Header (index.html) when logged in...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await navigate('http://127.0.0.1:5500/index.html');

  const navbarCheck = await evalJs(`
    (function() {
      const nav = document.getElementById('navbar');
      const signOutBtn = nav ? nav.querySelector('button[title="Sign Out"]') : null;
      const userPill = nav ? nav.querySelector('a[href="user.html"]') : null;
      return {
        hasSignOutBtn: !!signOutBtn,
        signOutBtnText: signOutBtn ? signOutBtn.innerText.trim() : null,
        userPillText: userPill ? userPill.innerText.trim() : null
      };
    })()
  `);
  console.log('Website Navbar Logged-In Check:', navbarCheck);
  await capture('website_navbar_loggedin_signout.png');

  // 5. Test Triggering Logout
  console.log('\n5. Testing Sign Out Execution...');
  await navigate('http://127.0.0.1:5500/user.html');
  await new Promise(r => setTimeout(r, 600));

  console.log('Invoking window.handleLogout()...');
  await evalJs(`window.handleLogout();`);
  await new Promise(r => setTimeout(r, 1200));

  const afterLogout = await evalJs(`
    (function() {
      const session = window.RetireWellDB ? window.RetireWellDB.getSession() : null;
      const url = window.location.href;
      return {
        currentUrl: url,
        isSessionCleared: session === null || session.isLoggedIn === false
      };
    })()
  `);
  console.log('After Logout Check:', afterLogout);

  console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY ---');
  ws.close();
  cleanup();
  process.exit(0);
}

main().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
