const fs = require('fs');
const html = fs.readFileSync('user.html', 'utf8');

// Find all document.getElementById('...') in user.html
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const usedIds = new Set();
while ((match = idRegex.exec(html)) !== null) {
  usedIds.add(match[1]);
}

console.log(`Checking ${usedIds.size} unique getElementById targets in user.html:`);
const missing = [];
for (const id of usedIds) {
  const pattern = new RegExp(`id=["']${id}["']`);
  if (!pattern.test(html)) {
    missing.push(id);
  }
}

if (missing.length === 0) {
  console.log("All getElementById targets exist in HTML!");
} else {
  console.log("MISSING IDs in HTML:", missing);
}
