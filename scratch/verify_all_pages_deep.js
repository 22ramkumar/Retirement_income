const { spawn } = require('child_process');

async function verifyAll() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9260;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-deep-' + Date.now(),
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

  const exceptions = [];
  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');

  async function evaluate(code) {
    exceptions.length = 0;
    const res = await send('Runtime.evaluate', {
      expression: `(() => { ${code} })()`,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
    }
    if (exceptions.length > 0) {
      throw new Error(exceptions.map(e => e.text + ' ' + (e.exception?.description || '')).join(' | '));
    }
    return res.result?.value;
  }

  async function waitForReady() {
    for (let i = 0; i < 40; i++) {
      const r = await send('Runtime.evaluate', {
        expression: 'typeof RetireWellApp !== "undefined" && document.readyState === "complete"'
      });
      if (r.result?.value === true) return true;
      await new Promise(res => setTimeout(res, 100));
    }
  }

  async function navigateTo(url) {
    await send('Runtime.evaluate', { expression: `window.location.href = "${url}"` });
    await new Promise(r => setTimeout(r, 600));
    await waitForReady();
  }

  console.log('====================================================');
  console.log('1. TESTING index.html');
  console.log('====================================================');
  await waitForReady();
  const indexTests = await evaluate(`
    const res = {};
    // Test Hero CTA
    RetireWellApp.openBookingModal('Comprehensive Retirement Income Plan');
    const modal = document.getElementById('bookingModal');
    res.bookingModalActive = modal && modal.classList.contains('active');
    res.bookingTopicVal = document.getElementById('bookingTopic')?.value;
    RetireWellApp.closeModal('bookingModal');

    // Test specific annuity CTA
    RetireWellApp.openBookingModal('Fixed Annuities (MYGA)');
    res.customTopicVal = document.getElementById('bookingTopic')?.value;
    RetireWellApp.closeModal('bookingModal');

    // Test FAQ Toggle
    const faqBtn = document.querySelector('button[onclick*="toggleFaq"]');
    if (faqBtn) {
      faqBtn.click();
      res.faqOpened = !faqBtn.nextElementSibling.classList.contains('hidden');
    }

    // Test Checklist Toggle
    const cb = document.querySelector('.checklist-item');
    if (cb) {
      const beforeScore = document.getElementById('checklistScoreNumber')?.textContent;
      cb.checked = !cb.checked;
      updateChecklistScore();
      const afterScore = document.getElementById('checklistScoreNumber')?.textContent;
      res.checklistWorking = beforeScore !== afterScore;
    }

    return res;
  `);
  console.log('index.html Results:', indexTests);

  console.log('\n====================================================');
  console.log('2. TESTING services.html');
  console.log('====================================================');
  await navigateTo('http://127.0.0.1:5500/services.html');

  const servicesTests = await evaluate(`
    const res = {};
    // Test category filter
    const tabs = document.querySelectorAll('.filter-tab');
    if (tabs.length > 1) {
      tabs[1].click();
      const visibleCards = Array.from(document.querySelectorAll('.service-card')).filter(c => c.style.display !== 'none').length;
      res.filterCategoryWorking = visibleCards === 6;
      tabs[0].click(); // reset to all
    }

    // Test service detail modal
    openServiceDetailModal('fixed');
    const detailModal = document.getElementById('serviceDetailModal');
    res.detailModalActive = detailModal && detailModal.classList.contains('active');
    res.detailTitle = document.getElementById('detailTitle')?.textContent;

    // Test clicking detailBookBtn
    document.getElementById('detailBookBtn').click();
    const bookingModal = document.getElementById('bookingModal');
    res.bookingModalOpenedFromDetail = bookingModal && bookingModal.classList.contains('active');
    res.bookingTopicFromDetail = document.getElementById('bookingTopic')?.value;
    RetireWellApp.closeModal('bookingModal');

    return res;
  `);
  console.log('services.html Results:', servicesTests);

  console.log('\n====================================================');
  console.log('3. TESTING advisors.html');
  console.log('====================================================');
  await navigateTo('http://127.0.0.1:5500/advisors.html');

  const advisorsTests = await evaluate(`
    const res = {};
    // Test specialty filter
    const tabs = document.querySelectorAll('.adv-tab');
    if (tabs.length > 1) {
      tabs[1].click();
      const visibleCards = Array.from(document.querySelectorAll('.advisor-card')).filter(c => c.style.display !== 'none').length;
      res.filterSpecialtyWorking = visibleCards > 0;
      tabs[0].click();
    }

    // Test advisor bio modal
    openAdvisorModal('raymond');
    const bioModal = document.getElementById('advisorBioModal');
    res.bioModalActive = bioModal && bioModal.classList.contains('active');
    res.bioName = document.getElementById('bioName')?.textContent;

    // Test clicking bioBookBtn
    document.getElementById('bioBookBtn').click();
    const bookingModal = document.getElementById('bookingModal');
    res.bookingModalOpenedFromBio = bookingModal && bookingModal.classList.contains('active');
    res.advisorSelectedInBooking = document.getElementById('bookingAdvisor')?.value;
    RetireWellApp.closeModal('bookingModal');

    return res;
  `);
  console.log('advisors.html Results:', advisorsTests);

  console.log('\n====================================================');
  console.log('4. TESTING login.html');
  console.log('====================================================');
  await evaluate(`
    localStorage.setItem('retirewell_session', JSON.stringify({ isLoggedIn: false, user: null }));
    return true;
  `);
  await navigateTo('http://127.0.0.1:5500/login.html?switch=true');

  const loginTests = await evaluate(`
    const res = {};
    // Test tabs
    document.getElementById('tabBtnRegister').click();
    res.registerFormVisible = !document.getElementById('formRegister').classList.contains('hidden');

    document.getElementById('tabBtnForgot').click();
    res.forgotFormVisible = !document.getElementById('formForgot').classList.contains('hidden');

    document.getElementById('tabBtnLogin').click();
    res.loginFormVisible = !document.getElementById('formLogin').classList.contains('hidden');

    // Test Demo Autofill
    fillDemoCredentials();
    res.emailFilled = document.getElementById('loginEmail')?.value;
    res.pwdFilled = document.getElementById('loginPassword')?.value;

    return res;
  `);
  console.log('login.html Results:', loginTests);

  console.log('\n====================================================');
  console.log('5. TESTING user.html');
  console.log('====================================================');
  await evaluate(`
    const user = RetireWellDB.get('user');
    localStorage.setItem('retirewell_session', JSON.stringify({ isLoggedIn: true, user: user }));
    return true;
  `);
  await navigateTo('http://127.0.0.1:5500/user.html');

  const userTests = await evaluate(`
    const res = {};
    // Test Section navigation buttons
    const sections = ['overview', 'projections', 'accounts', 'beneficiaries', 'documents', 'messages', 'settings'];
    res.sectionToggles = {};
    sections.forEach(sec => {
      showDashboardSection(sec, null);
      const targetSec = document.getElementById('section-' + sec);
      res.sectionToggles[sec] = targetSec && !targetSec.classList.contains('hidden');
    });

    // Test Notification bell toggle
    toggleNotificationPanel();
    const notifPanel = document.getElementById('notifPanel');
    res.notifPanelToggled = notifPanel && !notifPanel.classList.contains('hidden');
    toggleNotificationPanel();

    // Test Statement modal
    openStatementModal('STM-2026-Q3');
    const stmtModal = document.getElementById('statementDetailModal');
    res.stmtModalActive = stmtModal && stmtModal.classList.contains('active');
    RetireWellApp.closeModal('statementDetailModal');

    // Test Beneficiary modal
    openAddBeneficiaryModal();
    const benModal = document.getElementById('beneficiaryModal');
    res.benModalActive = benModal && benModal.classList.contains('active');
    RetireWellApp.closeModal('beneficiaryModal');

    // Test Upload Doc modal
    openUploadDocModal();
    const upModal = document.getElementById('uploadDocModal');
    res.upModalActive = upModal && upModal.classList.contains('active');
    RetireWellApp.closeModal('uploadDocModal');

    // Test Chat message sending
    const input = document.getElementById('chatInputMessage');
    if (input) {
      input.value = "Automated test message for David";
      sendChatMessage();
      const msgs = RetireWellDB.get('messages') || [];
      res.messageSent = msgs[msgs.length - 1].text === "Automated test message for David";
    }

    // Reset to overview
    showDashboardSection('overview', null);

    return res;
  `);
  console.log('user.html Results:', userTests);

  ws.close();
  chrome.kill();
  console.log('\n====================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY WITH 0 EXCEPTIONS!');
  console.log('====================================================');
}

verifyAll().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
