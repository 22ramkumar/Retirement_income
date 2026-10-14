const fs = require('fs');
const html = fs.readFileSync('user.html', 'utf8');

// Match scripts
const regex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  const code = match[1];
  try {
    new Function(code);
    console.log(`Script ${count} syntax OK (${code.length} chars)`);
  } catch (err) {
    console.error(`Script ${count} SYNTAX ERROR:`, err.message);
  }
}
console.log(`Total inline script blocks checked: ${count}`);
