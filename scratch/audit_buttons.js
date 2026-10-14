const fs = require('fs');

const files = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html', 'js/navbar.js', 'js/footer.js', 'js/app.js'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const emptyOnclick = [...content.matchAll(/onclick=["']\s*["']/gi)];
  const hashHref = [...content.matchAll(/href=["']#["']/gi)];
  const javascriptVoid = [...content.matchAll(/href=["']javascript:void\(0\);?["']/gi)];
  
  // Also check for anchor tags without href or onclick
  const deadAnchors = [...content.matchAll(/<a(?![^>]*\b(href|onclick)\b)[^>]*>/gi)];
  
  // Also check buttons without type=submit, form, or onclick or id
  const deadButtons = [];
  const btnRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
  let bm;
  while ((bm = btnRegex.exec(content)) !== null) {
    const attrs = bm[1];
    const hasOnclick = /onclick=/i.test(attrs);
    const hasSubmit = /type=["']submit["']/i.test(attrs);
    const hasId = /id=["']/i.test(attrs);
    if (!hasOnclick && !hasSubmit && !hasId) {
      deadButtons.push(bm[0].substring(0, 80));
    }
  }

  console.log(`=== ${f} ===`);
  if (emptyOnclick.length) console.log('  Empty onclicks:', emptyOnclick.length);
  if (hashHref.length) console.log('  href="#":', hashHref.length);
  if (javascriptVoid.length) console.log('  javascript:void(0):', javascriptVoid.length);
  if (deadAnchors.length) console.log('  Dead anchors (no href/onclick):', deadAnchors.length);
  if (deadButtons.length) {
    console.log('  Potentially dead buttons (no onclick/id/submit):', deadButtons.length);
    deadButtons.forEach(b => console.log('    ' + b));
  }
  if (!emptyOnclick.length && !hashHref.length && !javascriptVoid.length && !deadAnchors.length && !deadButtons.length) {
    console.log('  Clean!');
  }
});
