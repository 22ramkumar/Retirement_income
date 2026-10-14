const http = require('http');
http.get('http://127.0.0.1:5500/index.html', res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Includes id="navbar":', d.includes('id="navbar"'));
    console.log('Includes navbar.js:', d.includes('navbar.js'));
    console.log('First 500 chars:\n', d.substring(0, 500));
  });
});
