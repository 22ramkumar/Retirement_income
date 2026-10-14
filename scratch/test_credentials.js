const { spawn } = require('child_process');

async function testNewCredentials() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9265;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-creds-' + Date.now(),
    'http://127.0.0.1:5500/login.html?switch=true'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const pageTarget = list.find(t => t.type === 'page' && t.url.includes('127.0.0.1')) || list.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

  for (let i = 0; i < 30; i++) {
    const r = await send('Runtime.evaluate', {
      expression: 'typeof RetireWellDB !== "undefined" && typeof fillDemoCredentials === "function"'
    });
    if (r.result?.value === true) break;
    await new Promise(res => setTimeout(res, 100));
  }

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const res = {};
      
      // 1. Direct DB Login test with new credentials
      const dbLogin = RetireWellDB.login("user@gmail.com", "1234");
      res.dbLoginSuccess = dbLogin.success;
      res.userName = dbLogin.user?.name;
      res.userEmail = dbLogin.user?.email;

      // 2. Test autofill button
      fillDemoCredentials();
      res.inputEmail = document.getElementById('loginEmail').value;
      res.inputPassword = document.getElementById('loginPassword').value;

      return res;
    })()`,
    returnByValue: true
  });

  console.log('Credentials Test Results:', result.result?.value);

  ws.close();
  chrome.kill();
}

testNewCredentials().catch(console.error);
