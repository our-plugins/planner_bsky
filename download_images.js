const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/05/mums-decadent-fruit-mince-tarts-indulge.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/quick-skillet-bread-in-10-minutes.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/churro-saltine-toffee-this-sweet-crispy.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/crumbl-style-pumpkin-pie-cookies-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/rich-and-creamy-shrimp-and-crab.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/mexican-street-corn-chicken-rice.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/traditional-christmas-fruit-cake-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/decadent-chocolate-fudge-pie-recipe-prep.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/hot-chocolate-poke-cake-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/carrot-cake-recipe-ingredients-1-cup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/raspberry-chocolate-lava-cupcakes-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cinnamon-sugar-pizza-with-crescent-rolls-a.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/santas-hat-shirley-temple-a-festive-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/raspberry-filled-almond-snowball-cookies-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/banana-bread-brownies-a-delightful-fusion.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/easy-homemade-pecan-pie-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/mini-pineapple-upside-down-cakes-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/butter-pecan-cookies-ingredients-1-cup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/creamy-lemon-fudge-ingredients-14-oz.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cinnamon-roll-fudge-ingredients-2-cups.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/pistachio-pudding-cookies-ingredients-1-cup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/salted-caramel-cheesecake-cookies-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/chocolate-fondant-a-rich-and-comforting.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cheesecake-stuffed-chocolate-chip-cookies-decadent.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/reeses-cheese-ball-ingredients-base-8.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cranberry-orange-pecan-muffins-ingredients-2.jpg"
];



const saveDirectory = 'C:\\uprecipes\\posts\\02-05-25';

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
