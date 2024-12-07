# Bluesky Automated Post Scheduler

This project automates posting to Bluesky based on a JSON configuration. It supports posts with text, images, and external links (with link previews). The script can handle scheduling posts to be published at specific times.

## Prerequisites

Before you can run this script, you need to have the following installed:

- **Node.js**: [Download and install Node.js](https://nodejs.org/)
- **TypeScript**: [Install TypeScript](https://www.typescriptlang.org/download)
- **Bluesky Account**: You need a Bluesky account and access credentials (username and password).

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

### 2. Install Dependencies

Install the required dependencies by running the following command in your terminal:

```bash
npm install
```

This will install all necessary packages, including the `@atproto/api` library for interacting with Bluesky.

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the project. Add your Bluesky username and password in this file like so:

```bash
BLUESKY_USERNAME=<your-username>
BLUESKY_PASSWORD=<your-password>
```

### 4. Prepare JSON File for Posts

You need to create a `posts.json` file, which contains the post data. Here's an example of what the `posts.json` file should look like:

```json
[
    {
        "text": "Hello world",
        "createAt": "20:35"
    },
    {
        "imagepath": "C:\\TypeScript\\img\\meme2.jpg",
        "text": "😂",
        "createAt": "20:36"
    },
    {
        "text": "check out this post!",
        "uri": "https://journalpets.com/why-do-dogs-lick-their-noses-uncover-the-surprising-reasons/",
        "title": "why-do-dogs-lick-their-noses-uncover-the-surprising-reasons",
        "description": "why-do-dogs-lick-their-noses-uncover-the-surprising-reasons",
        "thumbnail": "C:\\TypeScript\\img\\why-do-dogs-lick-their-noses-close-up-shot-of-a-playful-dog-with-a-bright.webp",
        "createAt": "20:37"
    }
]
```

- **Text Posts**: Simple text posts with a `createAt` time.
- **Image Posts**: Posts with an `imagepath` pointing to an image file (either absolute or relative).
- **Link Posts**: Posts that contain a link (`uri`) along with an optional title, description, and thumbnail.

Make sure to adjust the paths according to where your images are located.

### 5. Compile TypeScript to JavaScript

The project is written in TypeScript, so you'll need to compile the TypeScript code to JavaScript before running it. Run the following command:

```bash
npx tsc
```

This will compile the TypeScript code in the `src` folder into JavaScript files in the `dist` folder.

### 6. Run the Script

Once compiled, you can run the JavaScript code using the following command:

```bash
node index.js
```

The script will read the `posts.json` file, schedule the posts based on their `createAt` times, and post the content to Bluesky.

### 7. (Optional) Schedule Posts Automatically

The script uses cron-style scheduling to post content at the specified times. For example, `"createAt": "20:35"` will schedule the post to be made at 8:35 PM. You can adjust the times in the JSON file as needed.

### 8. How It Works

The script handles four possible post types:

1. **Text Posts**: Posts containing only text.
2. **Image Posts**: Posts that include an image, where the `imagepath` points to the image file.
3. **Link Posts**: Posts containing an external link. If a thumbnail is provided, the script will upload the thumbnail.
4. **Mixed Posts**: Posts that combine both images and text or links.

### 9. Logging

The script logs each action, so you can monitor what is being posted and when. It will also log errors if there are any issues with uploading images or posting content.

---

### Example of a Scheduled Post:

```json
{
  "text": "Check out this post!",
  "uri": "https://example.com",
  "title": "Example Post",
  "description": "This is an example of a post with a link.",
  "thumbnail": "C:\\TypeScript\\img\\example-thumbnail.jpg",
  "createAt": "20:45"
}
```

In this case, a post with the text "Check out this post!" and a link to "https://example.com" will be scheduled to post at 8:45 PM, with an optional thumbnail image.

---

### Notes

- Ensure the paths to the images in the `imagepath` and `thumbnail` fields are correct.
- The images should be in the `img/` directory for relative paths to work properly.
- The script uses `cron` for scheduling posts. Make sure your server environment allows for scheduled tasks to run.

---
```