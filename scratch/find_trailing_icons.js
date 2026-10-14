const fs = require('fs');

const files = [
  'index.html',
  'home-2.html',
  'index-2.html',
  'services.html',
  'advisors.html',
  'user.html',
  'login.html',
  'js/navbar.js',
  'js/footer.js'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    // Check for span before i
    if (/<span[^>]*>.*<\/span>\s*<i\s+class=/i.test(l)) {
      console.log(`[SPAN_BEFORE_ICON] ${f}:${i+1}: ${l.trim()}`);
    }
  });
});
