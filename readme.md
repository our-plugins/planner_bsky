# Planner Bsky

## Overview
Planner Bsky is a script designed to schedule and automate posts on the Bluesky platform. It supports text posts, image uploads, and external link sharing, allowing users to create content ahead of time and schedule it for specific times.

## Features
- Schedule posts with text, images, or links.
- Supports RichText formatting with links and mentions.
- Automatically uploads images and generates embeds for external links.
- Reuses session tokens to avoid rate limits.
- Reads posts configuration from a JSON file.

## Requirements

### Prerequisites
- Node.js (v16 or later)
- NPM (Node Package Manager)
- A Bluesky account

### Dependencies
Install the following Node.js packages using npm:
```bash
npm install @atproto/api dotenv cron
```

## Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/planner_bsky.git
   cd planner_bsky
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env` file in the root directory and add your Bluesky credentials:
   ```bash
   BLUESKY_USERNAME=your_username
   BLUESKY_PASSWORD=your_password
   ```

4. Create an `.bsky-session.json` file in the root directory (empthy file)

5. Prepare your `posts.json` file in the root directory to define your posts (see the example below).

## Posts.json Example
```json
[
    {
        "text": "Hello world",
        "createAt": "20:35"
    },
    {
        "imagepath": "C:\\TypeScript\\img\\meme2.jpg",
        "text": ":joy:",
        "createAt": "20:36"
    },
    {
        "imagepath": "C:\\TypeScript\\img\\meme5.PNG",
        "createAt": "14:50"
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

## Usage

### Run the Script
To start the scheduler, run the script with:
```bash
node index.js
```

### Workflow
1. The script reads the `posts.json` file for scheduled posts.
2. Posts are automatically published at the specified time.
3. If all posts are scheduled and executed, the script will exit.

## Troubleshooting

### Common Errors
- **Rate Limit Exceeded:** Reuse session tokens to avoid exceeding the daily limit. The script includes this functionality.
- **Invalid File Path:** Ensure all image paths in `posts.json` are valid and accessible.

### Debugging
Run the script in verbose mode for additional logs:
```bash
DEBUG=true node index.js
```

## Contributing

1. Fork this repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgments
- Built using the [@atproto/api](https://github.com/bluesky-social/atproto) library.
- Inspired by Bluesky’s social posting API.

---
Feel free to raise an issue or create a discussion if you encounter problems or have feature suggestions!

