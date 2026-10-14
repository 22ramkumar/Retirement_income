const { spawn } = require('child_process');

async function testIndexDirect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9255;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-direct-' + Date.now(),
    'http://127.0.0.1:5500/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  console.log('Targets in Chrome:', list.map(t => ({ type: t.type, url: t.url })));
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
  await new Promise(r => setTimeout(r, 1000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        hasRetireWellApp: typeof RetireWellApp !== 'undefined',
        hasRetireWellDB: typeof RetireWellDB !== 'undefined',
        buttonCount: document.querySelectorAll('button').length
      };
    })()`,
    returnByValue: true
  });

  console.log('Direct test result:', res.result?.value);

  ws.close();
  chrome.kill();
}

testIndexDirect().catch(console.error);
