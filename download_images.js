const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/04/classic-cherry-delight-ingredients-for-the.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/homemade-whipped-cinnamon-pumpkin-honey-butter.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/bang-bang-chicken-skewers-recipe-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/southern-tea-cake-cookies-ingredients-1-1.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/southern-tea-cake-cookies-ingredients-.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/no-bake-candy-cane-pie-indulge-in.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/creamy-garlic-butter-salmon-and-shrimp-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/strawberry-chocolate-layer-cake-ingredients-chocolate-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/decadent-chocolate-caramel-ice-cream-cake-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/surf-and-turf-with-saffron-rice-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/red-velvet-cheesecake-recipe-ingredients-for-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/creamy-garlic-mushroom-sauce-ingredients-2-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/strawberry-pretzel-salad-ingredients-2-cups.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/surf-and-turf-with-creamy-alfredo-768x635.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/rice-krispie-cheesecake-ingredients-for-the.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/garlic-butter-chicken-pasta-ingredients-300g.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/fudgy-chocolate-brownies-with-strawberries-recipe.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/mini-banoffee-pies-recipe-ingredients-for.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/chocolate-raspberry-granola-parfaits-recipe-ingredients.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/04/red-velvet-cake-with-whipped-cream.jpg"
];



const saveDirectory = 'C:\\uprecipes\\posts\\19-04-25';

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
