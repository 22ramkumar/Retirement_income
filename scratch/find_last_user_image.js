const fs = require('fs');
const path = 'C:\\Users\\Ramkumar\\.gemini\\antigravity-ide\\brain\\22685039-72ec-48f8-ba4b-8bc48e08ff96\\.system_generated\\logs\\transcript_full.jsonl';

const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('"type":"USER_INPUT"')) {
    const obj = JSON.parse(lines[i]);
    console.log('Step index:', obj.step_index);
    console.log('Keys:', Object.keys(obj));
    for (const key of Object.keys(obj)) {
      if (key !== 'content') {
        console.log(key, ':', JSON.stringify(obj[key]).slice(0, 300));
      }
    }
    // check if content has images or parts
    if (typeof obj.content !== 'string') {
      console.log('content is object:', JSON.stringify(obj.content).slice(0, 500));
    } else {
      console.log('content string length:', obj.content.length);
    }
    // Check if there are other keys like parts, media, images
    break;
  }
}
