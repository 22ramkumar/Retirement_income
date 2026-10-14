const fs = require('fs');

const files = [
  'index.html',
  'home-2.html',
  'index-2.html',
  'services.html',
  'advisors.html',
  'user.html',
  'login.html',
  'js/footer.js'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('left-3') || (l.includes('left-') && l.includes('absolute')) || (l.includes('$') && l.includes('absolute'))) {
      console.log(`[ABSOLUTE_PREFIX] ${f}:${i+1}: ${l.trim()}`);
    }
  });
});
