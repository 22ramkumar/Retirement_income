const fs = require('fs');

const content = fs.readFileSync('user.html', 'utf8');
const scriptMatches = content.match(/<script[\s\S]*?<\/script>/gi) || [];

console.log('Total script tags:', scriptMatches.length);

scriptMatches.forEach((s, idx) => {
  if (s.includes('src=')) {
    const src = (s.match(/src=["']([^"']+)["']/) || [])[1];
    console.log(`[${idx}] External script: ${src}`);
  } else {
    const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      new Function(code);
      console.log(`[${idx}] Inline script: OK (${code.length} chars)`);
    } catch (err) {
      console.error(`[${idx}] Inline script ERROR:`, err.message);
    }
  }
});
