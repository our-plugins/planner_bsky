const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/04/maple-bacon-cheddar-biscuits-ingredients-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/you-need-to-try-this-turkey.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/potato-chip-cookies-ingredients-1-cup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/peanut-butter-balls-with-chocolate-rice.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/garlic-parmesan-chicken-meatloaves-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/layered-peppermint-crisp-and-cherry-cream.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/cinnamon-peach-crumble-bars-ingredients-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/southern-cherry-cobbler-bars-ingredients-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/classic-st.-louis-gooey-butter-cake.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/pistachio-crunch-muffins-ingredients-for-the.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/my-family-love-this-cranberry-turkey.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/flaky-crescent-rolls-stuffed-with-creamy.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/i-make-this-savory-sausage-and-cheese-muffins-do-you-like-it-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/cheesecake-stuffed-chocolate-chip-cookies-ingredients.jpg"
];



const saveDirectory = 'C:\\uprecipes\\posts\\29-04-25';

if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

function downloadImage(url, filepath) {
  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(`Failed to get '${url}' (${res.statusCode})`);
      }
    }).on('error', reject);
  });
}

(async () => {
  for (let i = 0; i < imageUrls.length; i++) {
    const filename = `${i + 1}.jpg`; // Always save as .jpg
    const filepath = path.join(saveDirectory, filename);
    try {
      console.log(`Downloading ${imageUrls[i]} to ${filepath}`);
      await downloadImage(imageUrls[i], filepath);
    } catch (err) {
      console.error(`Error downloading ${imageUrls[i]}: ${err}`);
    }
  }
})();
