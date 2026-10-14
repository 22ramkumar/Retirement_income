const https = require('https');
const fs = require('fs');
const path = require('path');

const videoUrl = 'https://v1.pinimg.com/videos/iht/expMp4/e5/d9/e2/e5d9e27b453af4260d55cffef1a81a05_540w.mp4';
const posterUrl = 'https://i.pinimg.com/videos/thumbnails/originals/e5/d9/e2/e5d9e27b453af4260d55cffef1a81a05.0000000.jpg';
const fallbackPosterUrl = 'https://i.pinimg.com/736x/a8/0e/a3/a80ea3972289906884514509c2e3f00c.jpg';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP status ' + res.statusCode + ' for ' + url));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('Saved:', dest, '(' + fs.statSync(dest).size + ' bytes)');
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  const videoDest = path.join(__dirname, '../videos/pin-14214555070355018.mp4');
  const posterDest = path.join(__dirname, '../images/pin-14214555070355018-poster.jpg');

  try {
    console.log('Downloading video...');
    await downloadFile(videoUrl, videoDest);
  } catch (e) {
    console.error('Error downloading video:', e.message);
  }

  try {
    console.log('Downloading poster...');
    await downloadFile(posterUrl, posterDest);
  } catch (e) {
    console.error('Poster download failed, trying fallback...', e.message);
    try {
      await downloadFile(fallbackPosterUrl, posterDest);
    } catch (e2) {
      console.error('Fallback poster failed:', e2.message);
    }
  }
}

run();
