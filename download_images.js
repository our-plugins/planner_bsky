const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const imageUrls = [
  "https://uprecipes.blog/wp-content/uploads/2025/05/creamy-banana-cream-cheesecake-hello-everyone.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/hello-friends-today-im-excited-to.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/chewy-nutty-squirrel-bars-a-treat-for-all-seasons.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/delicious-stuffed-bell-peppers-hello-friends.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/summer-peach-and-blueberry-salad-preparation.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/mouthwatering-best-beef-enchiladas.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/delectable-pepper-honey-cedar-plank-salmon.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/delicious-and-vibrant-ube-macapuno-cake.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/decadent-chocolate-strawberry-cheesecake.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/brown-butter-pear-cake-a-cozy.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/crispy-fried-chicken-the-perfect-recipe.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/savory-braised-oxtails-in-red-wine-sauce.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/fun-and-tasty-poop-emoji-cookies.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/flavorful-beef-enchiladas-hello-wonderful-friends.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/decadent-brownie-caramel-cheesecake.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/grilled-scallops-hello-seafood-lovers-if.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/bacon-ranch-chicken-skewers-hello-grill.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/cocojito-frozen-mojito-hello-cocktail-enthusiasts.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/delicious-chocolate-mint-cookies.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/decadent-chocolate-fudge-pie-recipe-prep.jpg",
  "https://uprecipes.blog/wp-content/uploads/2025/05/black-forest-tiramisu-ingredients-400g.jpg"
];



const saveDirectory = 'C:\\uprecipes\\posts\\08-05-25';

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
