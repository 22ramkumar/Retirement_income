const { spawn } = require('child_process');

async function testLoginLoggedOut() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-login-' + Date.now()
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const url = `http://127.0.0.1:5500/login.html`;
  const res = await fetch(`http://127.0.0.1:9222/json/new?${url}`, { method: 'PUT' });
  const p = await res.json();
  const ws = new WebSocket(p.webSocketDebuggerUrl);

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

  await send('Runtime.enable');
  await send('Page.enable');

  // Clear session first so it doesn't auto redirect
  await send('Runtime.evaluate', {
    expression: `localStorage.removeItem('retirewell_session');`
  });

  // Navigate to login.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/login.html' });
  await new Promise(r => setTimeout(r, 1200));

  // Get buttons
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        id: b.id,
        onclick: b.getAttribute('onclick'),
        type: b.getAttribute('type')
      }));
    })()`,
    returnByValue: true
  });

  console.log('Login buttons when logged out:', r.result?.value);

  // Test switching tabs on login.html
  console.log('Testing switchAuthTab("register")...');
  const regTab = await send('Runtime.evaluate', {
    expression: `(() => {
      switchAuthTab('register');
      return {
        loginHidden: document.getElementById('formLogin').classList.contains('hidden'),
        registerHidden: document.getElementById('formRegister').classList.contains('hidden')
      };
    })()`,
    returnByValue: true
  });
  console.log('Register tab result:', regTab.result?.value);

  console.log('Testing switchAuthTab("forgot")...');
  const forgotTab = await send('Runtime.evaluate', {
    expression: `(() => {
      switchAuthTab('forgot');
      return {
        forgotHidden: document.getElementById('formForgot').classList.contains('hidden')
      };
    })()`,
    returnByValue: true
  });
  console.log('Forgot tab result:', forgotTab.result?.value);

  // Test fillDemoCredentials if exists
  console.log('Testing demo credential button or filling credentials...');
  const demoRes = await send('Runtime.evaluate', {
    expression: `(() => {
      if (typeof fillDemoCredentials === 'function') {
        fillDemoCredentials();
        return {
          email: document.getElementById('loginEmail').value,
          pwd: document.getElementById('loginPassword').value
        };
      }
      return { noDemoFn: true };
    })()`,
    returnByValue: true
  });
  console.log('Demo creds result:', demoRes.result?.value);

  ws.close();
  chrome.kill();
}

testLoginLoggedOut();
