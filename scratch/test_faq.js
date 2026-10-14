const { spawn } = require('child_process');

async function testFaq2() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9270;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-faq-' + Date.now(),
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
  await new Promise(r => setTimeout(r, 1000));

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const res = {};
      const allFaqButtons = Array.from(document.querySelectorAll('#faqAccordion button'));
      res.faqButtonCount = allFaqButtons.length;

      // Find FAQ 2 specifically
      const faq2Btn = allFaqButtons.find(b => b.textContent.includes('emergency'));
      if (!faq2Btn) return { error: 'FAQ 2 button not found' };

      // Inspect structure
      res.buttonTagName = faq2Btn.tagName;
      res.innerChildrenTags = Array.from(faq2Btn.children).map(c => c.tagName);
      const icon = faq2Btn.querySelector('.bi-chevron-down');
      res.iconFound = !!icon;
      res.iconTagName = icon?.tagName;

      // Check alignment / positions
      const btnRect = faq2Btn.getBoundingClientRect();
      const textSpan = faq2Btn.querySelector('span');
      const textRect = textSpan?.getBoundingClientRect();
      const iconRect = icon?.getBoundingClientRect();
      
      res.btnWidth = btnRect.width;
      res.textLeft = textRect?.left;
      res.iconLeft = iconRect?.left;
      res.isIconOnRightSide = iconRect && textRect ? (iconRect.left > textRect.right) : false;
      res.isVerticallyAligned = iconRect && textRect ? Math.abs((iconRect.top + iconRect.height / 2) - (textRect.top + textRect.height / 2)) < 15 : false;

      // Before click: answer hidden?
      const card = faq2Btn.closest('.rw-card');
      const answer = card.querySelector('.faq-answer');
      res.answerInitiallyHidden = answer.classList.contains('hidden');

      // Click to toggle
      faq2Btn.click();
      res.answerNowVisible = !answer.classList.contains('hidden');
      res.answerTextSnippet = answer.textContent.trim().substring(0, 60);
      res.iconRotated = icon.classList.contains('rotate-180');

      // Click again to close
      faq2Btn.click();
      res.answerClosedAgain = answer.classList.contains('hidden');

      return res;
    })()`,
    returnByValue: true
  });

  console.log('FAQ 2 Verification Result:', result.result?.value);

  ws.close();
  chrome.kill();
}

testFaq2().catch(console.error);
