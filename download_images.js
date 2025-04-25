const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
"https://uprecipes.blog/wp-content/uploads/2025/04/olive-oil-orange-cornmeal-cake-ingredients.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/easy-sugar-cone-cornucopias-ingredients-6.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/nutella-star-bread-with-puff-pastry.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/2-9.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/pumpkin-cannoli-ingredients-12-cannoli-shells.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/2-cups-7.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/hi-there-breakfast-planner.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/hi-there-holiday-host.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/hi-there-salad-enthusiast.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/pumpkin-fluff-dip-ingredients-1-can.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/easy-apple-crisp-ingredients-6-cups.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/cinnamon-roll-apple-crisp-ingredients-2.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/easy-baked-pumpkin-pudding-ingredients-1.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/quick-brussels-and-bacon-a-savory-and-delicious-combo.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/pan-fried-brussels-sprouts-simple-crispy-and-delicious.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/black-bean-huevos-rancheros-a-flavor-packed-mexican-classic.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/eggplant-meatballs-a-delicious-vegetarian-twist-on-classic-meatballs-full-of-flavor-and-perfect-for-any-pasta-or-sub.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/korean-fried-chicken-crispy-savory-and-irresistible.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/skillet-chicken-bulgogi-a-savory-and-sweet-korean-classic.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/simple-slow-cooked-korean-beef-soft-tacos-bold-flavors-in-every-bite.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/korean-spicy-marinated-pork-dae-ji-bool-gogi-a-bold-and-flavorful-delight.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/best-tuna-melt-new-jersey-diner.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/amazing-ground-turkey-tomato-sauce-your-new-go-to-for-pasta-night.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/italian-style-turkey-meatloaf-a-savory-and-satisfying-dinner-classic-with-an-italian-twist.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/quick-artichoke-pasta-salad-ingredients-.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/black-bean-and-chickpea-chili-ingredients.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/banana-banana-bread-ingredients-4.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/joys-easy-banana-bread-ingredients-.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/banana-chocolate-chip-bread-ingredients-.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/janets-rich-banana-bread-ingredients-.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/philly-cheesesteak-sandwich-with-garlic-mayo.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/this-recipe-contains-seafood.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/jiffy-corn-casserole-the-perfect-comfort-dish.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/slow-cooker-stuffing-holiday-magic-made-easy.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/grate-apple-crisp-ingredients-6-cups.jpg",
"https://uprecipes.blog/wp-content/uploads/2025/04/acorn-candy-cookies-ingredients-1-package.jpg"];



const saveDirectory = 'C:\\uprecipes\\posts\\23-04-25';

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
