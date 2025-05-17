const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/05/german-chocolate-poke-cake-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/old-fashioned-bread-pudding-with-vanilla-sauce.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/halloween-pizza-skulls-ingredients-1-tube.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/crab-stuffed-mushrooms-ingredients-3.5-oz-lump.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/lemonade-puppy-chow-ingredients-9-cups.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/no-bake-pumpkin-cheesecake-balls-ingredients-8.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/beary-delicious-peanut-butter-paw-prints.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/gingerbread-crinkle-cookie-sandwiches-with-vanilla.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/peanut-butter-cup-frappuccino-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/chocolate-chip-cookie-pie-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/chocolate-monster-cookies-ingredients-1-cup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/turtle-coffee-cocktail-ingredients-1-ounce.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/buldak-korean-fire-chicken-ingredients-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/pineapple-heaven-cheesecake-ingredients-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/just-made-my-granddads-favorite-recipe-german-potato-pancakes-kartoffelpuffer.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cider-maple-oven-roasted-cornish-hen-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/million-dollar-ravioli-casserole-ingredients-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/chicken-bacon-ranch-sliders-savory-chicken.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/overnight-taco-pasta-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/honey-butter-skillet-corn-ingredients-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/lazy-chocolate-chip-cookie-bars-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/gooey-coffee-caramel-pecan-cake-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cherry-cheesecake-bars-ingredients-for-the.jpg"
];




const saveDirectory = 'C:\\uprecipes\\posts\\14-05-25';

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
