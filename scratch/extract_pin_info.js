const fs = require('fs');

const content = fs.readFileSync('C:/Users/Ramkumar/.gemini/antigravity-ide/brain/22685039-72ec-48f8-ba4b-8bc48e08ff96/.system_generated/steps/440/content.md', 'utf8');

const regex = /https:\/\/[^"'\s]+(?:pinimg\.com)[^"'\s]+/g;
const matches = content.match(regex) || [];
const unique = [...new Set(matches)];

console.log('Found pinimg URLs:');
unique.filter(u => u.includes('5f06679785b82c23818688c7646e865f')).forEach(u => console.log(' -', u));

const originals = unique.filter(u => u.includes('/originals/'));
console.log('Originals:');
originals.forEach(u => console.log(' *', u));
