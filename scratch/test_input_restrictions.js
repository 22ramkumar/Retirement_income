const { spawn } = require('child_process');

async function testRestrictions() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9281;
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-restr-' + Date.now(),
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

  // 1. Test Index.html Booking Modal
  const bookingResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const res = {};
      RetireWellApp.openBookingModal();

      const nameInput = document.getElementById('bookingName');
      const phoneInput = document.getElementById('bookingPhone');

      // Keydown block check on name input:
      const numKeyEvent = new KeyboardEvent('keydown', { key: '5', cancelable: true });
      nameInput.dispatchEvent(numKeyEvent);
      res.nameKeyDownNumPrevented = numKeyEvent.defaultPrevented;

      const letterKeyEvent = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      nameInput.dispatchEvent(letterKeyEvent);
      res.nameKeyDownAlphaAllowed = !letterKeyEvent.defaultPrevented;

      // Keydown block check on phone input:
      const pLetterKeyEvent = new KeyboardEvent('keydown', { key: 'k', cancelable: true });
      phoneInput.dispatchEvent(pLetterKeyEvent);
      res.phoneKeyDownLetterPrevented = pLetterKeyEvent.defaultPrevented;

      const pNumKeyEvent = new KeyboardEvent('keydown', { key: '8', cancelable: true });
      phoneInput.dispatchEvent(pNumKeyEvent);
      res.phoneKeyDownNumAllowed = !pNumKeyEvent.defaultPrevented;

      // Paste / input sanitization
      nameInput.value = 'Margaret123 & Robert456 Vance!!!';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      res.nameInputSanitized = nameInput.value;

      phoneInput.value = '(617) abc555-xyz0199!!';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      res.phoneInputSanitized = phoneInput.value;

      // Submit validation test
      nameInput.value = 'Margaret123'; // invalid
      phoneInput.value = '5550199';
      document.getElementById('bookingEmail').value = 'test@example.com';
      document.getElementById('bookingDate').value = '2026-10-20';
      document.getElementById('bookingTime').value = '02:00 PM EST';

      let lastToast = '';
      const origToast = RetireWellApp.toast;
      RetireWellApp.toast = (msg) => { lastToast = msg; };

      RetireWellApp.submitBooking(new Event('submit'));
      res.invalidNameRejected = (lastToast === 'Full Name must contain alphabets only.');

      nameInput.value = 'Margaret Vance';
      phoneInput.value = 'invalidphone';
      RetireWellApp.submitBooking(new Event('submit'));
      res.invalidPhoneRejected = (lastToast === 'Phone Number must contain numbers only (at least 7 digits).');

      RetireWellApp.toast = origToast;
      return res;
    })()`,
    returnByValue: true
  });

  console.log('Booking Modal Input Restrictions & Validation:', bookingResult.result?.value);

  // 2. Test Login.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/login.html' });
  await new Promise(r => setTimeout(r, 1200));

  const loginResult = await send('Runtime.evaluate', {
    expression: `(() => {
      switchAuthTab('register');
      const regName = document.getElementById('regName');
      const regPhone = document.getElementById('regPhone');

      const kNum = new KeyboardEvent('keydown', { key: '9', cancelable: true });
      regName.dispatchEvent(kNum);
      const kAlpha = new KeyboardEvent('keydown', { key: 'm', cancelable: true });
      regPhone.dispatchEvent(kAlpha);

      regName.value = 'Robert999 Vance$$';
      regName.dispatchEvent(new Event('input', { bubbles: true }));

      regPhone.value = '(617) abc-555';
      regPhone.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        regNameKeyPrevented: kNum.defaultPrevented,
        regPhoneKeyPrevented: kAlpha.defaultPrevented,
        regNameSanitized: regName.value,
        regPhoneSanitized: regPhone.value
      };
    })()`,
    returnByValue: true
  });

  console.log('Login Registration Input Restrictions:', loginResult.result?.value);

  // 3. Test User.html
  await send('Page.navigate', { url: 'http://127.0.0.1:5500/user.html' });
  await new Promise(r => setTimeout(r, 1200));

  const userResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const pName = document.getElementById('setProfileName');
      const pPhone = document.getElementById('setProfilePhone');

      const kNum = new KeyboardEvent('keydown', { key: '3', cancelable: true });
      pName.dispatchEvent(kNum);
      const kAlpha = new KeyboardEvent('keydown', { key: 'x', cancelable: true });
      pPhone.dispatchEvent(kAlpha);

      pName.value = 'Robert Vance 2026';
      pName.dispatchEvent(new Event('input', { bubbles: true }));

      pPhone.value = '(617) call-now';
      pPhone.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        profileNameKeyPrevented: kNum.defaultPrevented,
        profilePhoneKeyPrevented: kAlpha.defaultPrevented,
        profileNameSanitized: pName.value,
        profilePhoneSanitized: pPhone.value
      };
    })()`,
    returnByValue: true
  });

  console.log('User Profile Settings Input Restrictions:', userResult.result?.value);

  ws.close();
  chrome.kill();
}

testRestrictions().catch(console.error);
