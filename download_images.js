const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/04/cinnamon-donut-bread-every-bite-of.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/mushroom-beef-casserole-ingredients-1-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/double-crust-cheesecake-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/low-carb-baked-chicken-tenders-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/crock-pot-potato-broccoli-cheddar-soup.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/cheesy-chicken-spinach-wrap-ingredients-2.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/crab-cake-egg-rolls-ingredients-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/hashbrown-sausage-bites-ingredients-4-cups.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/banana-split-icebox-cake-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/baltimore-crab-cakes-recipe-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/oven-baked-candied-strawberries-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/creamy-alfredo-lasagna-soup-ingredients-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/broccoli-rice-cheese-and-chicken-casserole.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/rice-krispie-cheesecake-ingredients-for-the-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/cranberry-orange-bread-this-fresh-zesty.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/black-forest-roll-cake-a-chocolate-cherry-delight.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/moist-coffee-cake-ingredients-cake-6.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/would-you-eat-sweet-and-savory-honey-roasted-butternut-squash-stuffed-with-brussels-sprouts-beets-carrots-cranberries-and-feta.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/would-you-eat-black-velvet-cake.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/cajun-salmon-and-shrimp-ingredients-4.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/skewers-surf-turf-meets-chimichurri.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/lobster-crab-and-salmon-alfredo-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/would-you-eat-this-creamy-garlic.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/would-you-eat-this-cajun-shrimp.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/mini-strawberry-cheesecakes-indulge-in-these.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/no-bake-strawberry-cheesecake-lasagna-this.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/lemon-raspberry-swirl-cheesecake-indulge-in.jpg"
];



const saveDirectory = 'C:\\uprecipes\\posts\\17-04-25';

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
