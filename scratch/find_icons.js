const fs = require('fs');

['index.html', 'home-2.html', 'js/navbar.js', 'js/footer.js'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const s = fs.readFileSync(file, 'utf8');
  const lines = s.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('<i class="bi') || l.includes('class="bi')) {
      console.log(`${file}:${i+1}: ${l.trim()}`);
    }
  });
});
