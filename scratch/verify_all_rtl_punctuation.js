const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96';

async function auditPage(fileRel, setupFn) {
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', fileRel).replace(/\\/g, '/');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9292',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  async function getPageTarget() {
    for (let i = 0; i < 15; i++) {
      try {
        const page = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9292/json/list', res => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
              try {
                const targets = JSON.parse(d);
                const p = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension:')) || targets[0];
                resolve(p);
              } catch (e) { reject(e); }
            });
          }).on('error', reject);
        });
        if (page && page.webSocketDebuggerUrl) return page;
      } catch (e) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    throw new Error('Failed to connect to Chrome on port 9292');
  }

  const target = await getPageTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 600));
  await send('Runtime.evaluate', { expression: "localStorage.clear();" });
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1000));

  // Switch to RTL mode
  await send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('dir', 'rtl');
      if (typeof RetireWellApp !== 'undefined') {
        RetireWellApp.state.isRTL = true;
      }
    `
  });
  await new Promise(r => setTimeout(r, 500));

  if (setupFn) {
    await send('Runtime.evaluate', { expression: setupFn });
    await new Promise(r => setTimeout(r, 500));
  }

  const evalResult = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (() => {
        const issues = [];
        const verified = [];

        // 1. Mandatory Asterisk (*) labels
        const labels = Array.from(document.querySelectorAll('label, .rw-card label, #bookingModal label'));
        labels.forEach(lbl => {
          if (lbl.offsetParent === null && lbl.offsetWidth === 0) return;
          const text = lbl.innerText.trim();
          if (text.includes('*')) {
            // Find asterisk element or char
            const astSpan = lbl.querySelector('.text-rose-500, .text-red-500, span:has(text)');
            const lblRect = lbl.getBoundingClientRect();
            
            // Get range for first word and asterisk
            let firstWordX = null;
            let astX = null;

            // Use DOM text nodes and Range
            const walker = document.createTreeWalker(lbl, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
              const val = node.nodeValue;
              if (!val.trim()) continue;
              const range = document.createRange();
              
              if (firstWordX === null) {
                range.setStart(node, 0);
                range.setEnd(node, Math.min(val.length, 3));
                const r = range.getBoundingClientRect();
                if (r.width > 0) firstWordX = r.x;
              }
              
              const starIdx = val.indexOf('*');
              if (starIdx !== -1) {
                range.setStart(node, starIdx);
                range.setEnd(node, starIdx + 1);
                const r = range.getBoundingClientRect();
                if (r.width > 0) astX = r.x;
              }
            }

            if (astX !== null && firstWordX !== null) {
              // In RTL, the label should be right-aligned with the asterisk at the RIGHT end
              // Since Latin text flows LTR, "Full Name *" has "Full" on the left and "*" on the right
              if (astX < firstWordX) {
                issues.push({
                  type: 'MANDATORY_ASTERISK_ON_LEFT',
                  label: text,
                  astX: Math.round(astX),
                  firstWordX: Math.round(firstWordX)
                });
              } else {
                verified.push({
                  type: 'MANDATORY_ASTERISK_OK',
                  label: text,
                  astX: Math.round(astX),
                  firstWordX: Math.round(firstWordX)
                });
              }
            }
          }
        });

        // 2. Headings and Paragraphs ending with punctuation (. : , ? %)
        const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, #bookingModal .p-3 span'));
        textElements.forEach(el => {
          if (el.offsetParent === null && el.offsetWidth === 0) return;
          const text = el.innerText.trim();
          if (text.length < 5) return;
          
          const lastChar = text[text.length - 1];
          if (['.', ':', ',', '?', '%'].includes(lastChar)) {
            // Find rect of the first character and the last punctuation character
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
            let firstCharX = null;
            let lastCharX = null;
            let textNodes = [];
            let node;
            while (node = walker.nextNode()) {
              if (node.nodeValue && node.nodeValue.trim()) textNodes.push(node);
            }

            if (textNodes.length > 0) {
              const firstNode = textNodes[0];
              const lastNode = textNodes[textNodes.length - 1];

              let rect1 = null;
              let rect2 = null;

              const r1 = document.createRange();
              r1.setStart(firstNode, 0);
              r1.setEnd(firstNode, 1);
              rect1 = r1.getBoundingClientRect();
              if (rect1.width > 0) firstCharX = rect1.x;

              const r2 = document.createRange();
              const lIdx = lastNode.nodeValue.lastIndexOf(lastChar);
              if (lIdx !== -1) {
                r2.setStart(lastNode, lIdx);
                r2.setEnd(lastNode, lIdx + 1);
                rect2 = r2.getBoundingClientRect();
                if (rect2.width > 0) lastCharX = rect2.x;
              }

              if (firstCharX !== null && lastCharX !== null && rect1 && rect2) {
                // If it's a single-line or the last line of a multi-line paragraph:
                // Check if the last character was pushed to the left of the words
                // In inverted bidi, the punctuation is at the far left boundary (e.g. rect2.x < el.getBoundingClientRect().x + 5)
                const elRect = el.getBoundingClientRect();
                // If lastCharX is smaller than the first character of that same line
                if (Math.abs(rect1.top - rect2.top) < 10 && lastCharX < firstCharX) {
                  issues.push({
                    type: 'PUNCTUATION_ON_LEFT',
                    char: lastChar,
                    textSnippet: text.substring(0, 35) + '...',
                    lastCharX: Math.round(lastCharX),
                    firstCharX: Math.round(firstCharX)
                  });
                }
              }
            }
          }
        });

        // 3. Tab buttons like "401(k) & Rollovers"
        const tabs = Array.from(document.querySelectorAll('.adv-tab, button'));
        tabs.forEach(tab => {
          if (tab.offsetParent === null && tab.offsetWidth === 0) return;
          const text = tab.innerText.trim();
          if (text.includes('401(k)')) {
            const tabRect = tab.getBoundingClientRect();
            // Check computed direction
            const comp = window.getComputedStyle(tab);
            if (comp.direction !== 'ltr') {
              issues.push({
                type: 'TAB_DIRECTION_NOT_LTR',
                text,
                direction: comp.direction
              });
            } else {
              verified.push({
                type: 'TAB_401K_OK',
                text,
                direction: comp.direction
              });
            }
          }
        });

        return {
          url: window.location.pathname,
          issuesCount: issues.length,
          issues,
          verifiedSample: verified.slice(0, 5)
        };
      })()
    `
  });

  if (evalResult.exceptionDetails) {
    console.error('Evaluate Exception:', evalResult.exceptionDetails);
  }

  ws.close();
  chrome.kill();

  return evalResult.result ? evalResult.result.value : null;
}

async function run() {
  console.log('Auditing pages in RTL mode for symbol/punctuation positions...\n');
  
  const pages = [
    { file: 'index.html', setup: "RetireWellApp.openBookingModal('Comprehensive Retirement Income Plan');" },
    { file: 'index.html', setup: null },
    { file: 'home-2.html', setup: null },
    { file: 'services.html', setup: null },
    { file: 'advisors.html', setup: null },
    { file: 'login.html', setup: "if (typeof switchAuthTab === 'function') switchAuthTab('register');" },
    { file: 'user.html', setup: null }
  ];

  let totalIssues = 0;

  for (const p of pages) {
    const res = await auditPage(p.file, p.setup);
    console.log(`Page: ${p.file} ${p.setup ? '(' + p.setup.substring(0, 25) + '...)' : ''}`);
    console.log(`  Issues: ${res.issuesCount}`);
    if (res.issuesCount > 0) {
      console.log('  Issues details:', JSON.stringify(res.issues, null, 2));
      totalIssues += res.issuesCount;
    } else {
      console.log('  All tested punctuation and symbols at the RIGHT END! Verified samples:', res.verifiedSample.length);
    }
  }

  console.log(`\n========================================`);
  console.log(`AUDIT FINISHED. Total issues found: ${totalIssues}`);
  console.log(`========================================`);
  process.exit(totalIssues === 0 ? 0 : 1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
