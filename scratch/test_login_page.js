const http = require('http');
const { execSync } = require('child_process');

async function testLoginPage() {
  const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
  const debuggingPort = 9225;
  const userDataDir = 'c:\\Users\\Ramkumar\\.gemini\\antigravity\\scratch\\retirewell\\scratch\\chrome_login_profile';

  // Start Chrome
  const cp = require('child_process').spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    'http://127.0.0.1:5500/login.html'
  ], { detached: true, stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  // Get WebSocket debugger URL
  const versionRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then(r => r.json());
  const pageWsUrl = versionRes[0].webSocketDebuggerUrl;

  const WebSocket = require('ws');
  const ws = new WebSocket(pageWsUrl);

  await new Promise(res => ws.on('open', res));

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === msgId) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Clear session to ensure we stay on login.html
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('retirewell_session', JSON.stringify({ isLoggedIn: false, user: null }));
      window.location.reload();
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  // Now evaluate page state and test tabs
  const result = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const res = {};
        res.url = window.location.href;
        res.tabBtnLogin = !!document.getElementById('tabBtnLogin');
        res.tabBtnRegister = !!document.getElementById('tabBtnRegister');
        res.tabBtnForgot = !!document.getElementById('tabBtnForgot');
        
        // Click Register tab
        document.getElementById('tabBtnRegister').click();
        res.regVisible = !document.getElementById('formRegister').classList.contains('hidden');
        res.loginHidden = document.getElementById('formLogin').classList.contains('hidden');

        // Click Forgot tab
        document.getElementById('tabBtnForgot').click();
        res.forgotVisible = !document.getElementById('formForgot').classList.contains('hidden');

        // Click Login tab
        document.getElementById('tabBtnLogin').click();
        res.loginVisibleNow = !document.getElementById('formLogin').classList.contains('hidden');

        // Test fillDemoCredentials if exists
        if (typeof fillDemoCredentials === 'function') {
          fillDemoCredentials();
          res.emailFilled = document.getElementById('loginEmail').value;
          res.pwdFilled = document.getElementById('loginPassword').value;
        }

        return res;
      })()
    `,
    returnByValue: true
  });

  console.log('Login Page Test Results:', result.result.value);

  ws.close();
  cp.kill();
}

testLoginPage().catch(console.error);
