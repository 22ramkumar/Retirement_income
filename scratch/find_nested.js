const fs = require('fs');

const files = ['index.html', 'services.html', 'advisors.html', 'login.html', 'user.html', 'js/navbar.js', 'js/footer.js'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Check for <button ...> where inner content has <button
  const buttonRegex = /<button[\s\S]*?<\/button>/gi;
  let m;
  while ((m = buttonRegex.exec(content)) !== null) {
    const inner = m[0].slice(7, -9);
    if (inner.includes('<button')) {
      console.log(`Found nested button in ${f}:`, m[0]);
    }
  }

  // Also check for <button class="...bi-chevron..."
  const chevronButtons = content.match(/<button[^>]*bi-chevron[^>]*>[\s\S]*?<\/button>/gi) || [];
  if (chevronButtons.length > 0) {
    console.log(`Found chevron buttons in ${f}:`, chevronButtons);
  }
});
