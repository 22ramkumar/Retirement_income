const fs = require('fs');

const files = [
  'index.html',
  'services.html',
  'advisors.html',
  'login.html',
  'user.html',
  'js/app.js',
  'js/data.js',
  'js/footer.js',
  'js/navbar.js',
  'js/projections.js'
];

console.log('--- STATIC AUDIT OF ONCLICK HANDLERS & BUTTONS ---');

const htmlFiles = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html', 'js/footer.js', 'js/navbar.js'];

const allOnclicks = [];
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const onclickRegex = /onclick=["']([^"']+)["']/g;
  let match;
  while ((match = onclickRegex.exec(content)) !== null) {
    allOnclicks.push({ file, code: match[1].trim() });
  }
}

console.log(`Total onclick handlers found across files: ${allOnclicks.length}`);

// Extract function calls from onclick
const fnCalls = new Map();
allOnclicks.forEach(({ file, code }) => {
  // Extract function name, e.g. "openConsultationModal('...')" -> "openConsultationModal"
  // or "RetireWellApp.openModal('...')" -> "RetireWellApp.openModal"
  const m = code.match(/^([a-zA-Z0-9_$.]+)\s*\(/);
  if (m) {
    const fnName = m[1];
    if (!fnCalls.has(fnName)) fnCalls.set(fnName, []);
    fnCalls.get(fnName).push({ file, code });
  } else {
    // maybe inline code like "this.parentElement.remove()"
    if (!fnCalls.has('[inline]')) fnCalls.set('[inline]', []);
    fnCalls.get('[inline]').push({ file, code });
  }
});

console.log('\nUnique functions called in onclick handlers:');
for (const [fn, occurrences] of fnCalls) {
  console.log(`- ${fn}: ${occurrences.length} call(s) (e.g. in ${occurrences[0].file}: "${occurrences[0].code.slice(0, 50)}")`);
}

// Check href="#" links across HTML files
console.log('\n--- CHECKING HREF ATTRIBUTES ---');
for (const file of ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html', 'js/footer.js', 'js/navbar.js']) {
  const content = fs.readFileSync(file, 'utf8');
  const aRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const deadLinks = [];
  while ((m = aRegex.exec(content)) !== null) {
    const href = m[1].trim();
    const tag = m[0];
    const text = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 30);
    const hasOnclick = tag.includes('onclick=');
    if ((href === '#' || href === '') && !hasOnclick) {
      deadLinks.push({ href, text, tag: tag.slice(0, 80) });
    }
  }
  if (deadLinks.length > 0) {
    console.log(`[${file}] ${deadLinks.length} dead link(s) (href="#" without onclick):`);
    deadLinks.forEach(d => console.log(`   - "${d.text}": ${d.tag}`));
  } else {
    console.log(`[${file}] 0 dead links.`);
  }
}
