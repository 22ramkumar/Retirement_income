const { spawn } = require('child_process');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=' + require('os').tmpdir() + '\\c_l1'
  ]);
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:9225/json/new?http://127.0.0.1:5500/login.html', { method: 'PUT' });
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
  await new Promise(r => setTimeout(r, 500));
  await send('Runtime.evaluate', {
    expression: 'localStorage.removeItem("retirewell_session"); window.location.href = "http://127.0.0.1:5500/login.html";'
  });
  await new Promise(r => setTimeout(r, 1500));
  const info = await send('Runtime.evaluate', {
    expression: 'document.body.innerHTML',
    returnByValue: true
  });
  console.log('info:', JSON.stringify(info));
  ws.close();
  chrome.kill();
}
test();
