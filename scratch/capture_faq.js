const { spawn } = require('child_process');
const fs = require('fs');

async function captureFaqScreenshot() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9275;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1280,1000',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-shot-' + Date.now(),
    'http://127.0.0.1:5500/index.html'
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
  await send('Page.enable');
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to FAQ and click FAQ 2 to open it
  await send('Runtime.evaluate', {
    expression: `(() => {
      const faq = document.getElementById('faqAccordion');
      if (faq) {
        faq.scrollIntoView({ block: 'center' });
        const allFaqButtons = Array.from(faq.querySelectorAll('button'));
        const faq2Btn = allFaqButtons.find(b => b.textContent.includes('emergency'));
        if (faq2Btn) faq2Btn.click();
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  const shot = await send('Page.captureScreenshot', {
    format: 'png'
  });

  const buf = Buffer.from(shot.data, 'base64');
  const artifactPath = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\30e878ba-dc4c-4db7-a3a9-a3461d23c3f2\\faq_fixed_screenshot.png';
  fs.writeFileSync(artifactPath, buf);
  console.log('Saved screenshot to:', artifactPath);

  ws.close();
  chrome.kill();
}

captureFaqScreenshot().catch(console.error);
