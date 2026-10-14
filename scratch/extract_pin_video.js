const fs = require('fs');

const content = fs.readFileSync('C:/Users/Ramkumar/.gemini/antigravity-ide/brain/22685039-72ec-48f8-ba4b-8bc48e08ff96/.system_generated/steps/1246/content.md', 'utf8');
const urls = content.match(/https:\/\/[^"'`\s<>)]+/g) || [];
const pinUrls = [...new Set(urls)].filter(u => u.includes('pinimg.com') || u.includes('.mp4') || u.includes('.m3u8') || u.includes('v.pinimg.com'));

console.log('Found matching URLs (' + pinUrls.length + '):');
pinUrls.forEach(u => console.log(' - ' + u));
