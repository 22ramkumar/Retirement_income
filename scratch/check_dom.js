const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9241', '--user-data-dir=' + require('os').tmpdir() + '\\test_dom'
  ]);
  await new Promise(r => setTimeout(r, 1200));
  const newTab = await fetch('http://127.0.0.1:9241/json/new?http://127.0.0.1:5500/index.html', { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(newTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, params = {}) => {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method: m, params }));
    return new Promise(res => {
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === msgId) { ws.removeEventListener('message', h); res(d.result); }
      };
      ws.addEventListener('message', h);
    });
  };
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1500));
  const res = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ tagCount: document.getElementsByTagName("*").length, buttonCount: document.getElementsByTagName("button").length, bodySnippet: document.body ? document.body.innerHTML.substring(0, 300) : "no body" })',
    returnByValue: true
  });
  console.log('Result:', JSON.parse(res.result.value));
  ws.close();
  chrome.kill();
}
run();
