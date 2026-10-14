const https = require('https');
const fs = require('fs');
const path = require('path');

const videoUrl = 'https://v1.pinimg.com/videos/iht/expMp4/26/a5/1f/26a51f4bb3ca08dce68ca6a83eb969c8_720w.mp4';
const posterUrl = 'https://i.pinimg.com/originals/36/a1/8c/36a18c870598bb96af87907a6443b334.jpg';
const fallbackPosterUrl = 'https://i.pinimg.com/1200x/36/a1/8c/36a18c870598bb96af87907a6443b334.jpg';

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
  const videoDest = path.join(__dirname, '../videos/hero-pin-763782418095890486.mp4');
  const posterDest = path.join(__dirname, '../images/hero-pin-763782418095890486-poster.jpg');

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
