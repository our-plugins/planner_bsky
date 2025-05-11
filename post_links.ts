import { BskyAgent, RichText } from '@atproto/api';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { promisify } from 'util';

dotenv.config();

// Define types
interface Account {
    username: string;
    password: string;
}

interface UncategorizedPost {
    id: number;
    title: string;
    description: string;
    featured_image: string;
    link: string;
}

interface Post {
    text?: string;
    imagepath?: string;
    alt?: string;
    uri?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    createAt: string;
}

// Rate limit tracking
let requestsThisMinute = 0;
let pointsThisHour = 0;
let lastRequestTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 3000;
const MAX_POINTS_PER_HOUR = 5000;

// Function to manage rate limits
async function manageRateLimits() {
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastRequestTime;

    if (timeElapsed >= 60000) { // If it's been more than a minute
        requestsThisMinute = 0; // Reset requests count
        lastRequestTime = currentTime;
    }

    if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - timeElapsed;
        console.log(`Rate limit reached. Waiting for ${waitTime / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, waitTime)); // Wait before making next request
    }
}

// Function to track points
function trackPoints(actionType: string) {
    const pointsMap: Record<string, number> = { CREATE: 3, UPDATE: 2, DELETE: 1 };
    pointsThisHour += pointsMap[actionType];
}

// Function to check point limits before posting
async function checkPointLimits() {
    if (pointsThisHour >= MAX_POINTS_PER_HOUR) {
        const waitTime = 60 * 60 * 1000 - (Date.now() % (60 * 60 * 1000)); // Wait until the next hour
        console.log(`Point limit reached. Waiting for ${waitTime / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, waitTime)); // Wait until the next hour
        pointsThisHour = 0; // Reset points at the start of the new hour
    }
}

// Function to read accounts from JSON file
function readAccountsFromFile(filePath: string): Account[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading accounts file:', error);
        return [];
    }
}

// Function to read uncategorized posts from a JSON file
function readUncategorizedPostsFromFile(filePath: string): UncategorizedPost[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading uncategorized posts file:', error);
        return [];
    }
}

// Function to clear the img directory
function clearImgDirectory() {
    const imgDir = 'img';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir);
        console.log('Created img directory');
        return;
    }
    
    // Clear existing files
    const files = fs.readdirSync(imgDir);
    for (const file of files) {
        fs.unlinkSync(path.join(imgDir, file));
    }
    console.log(`Cleared ${files.length} files from img directory`);
}

// Function to download an image from a URL to the img directory
async function downloadImage(url: string, fileName: string): Promise<void> {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const imgPath = path.join('img', fileName);
        const writer = fs.createWriteStream(imgPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading image from ${url}:`, error);
        throw error;
    }
}

// Function to format posts from uncategorized posts
function formatPosts(uncategorizedPosts: UncategorizedPost[]): Post[] {
    const formattedPosts: Post[] = [];
    
    for (const post of uncategorizedPosts) {
        // Calculate posting time (current time + 5 minutes)
        const postDate = new Date();
        postDate.setMinutes(postDate.getMinutes() + 5);
        
        formattedPosts.push({
            text: post.title,
            uri: post.link,
            title: post.title,
            description: post.description,
            thumbnail: `${post.id}.jpg`,
            createAt: postDate.toISOString()
        });
    }
    
    return formattedPosts;
}

// Function to upload a file as a blob
async function uploadBlob(agent: BskyAgent, filePath: string): Promise<any> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = `image/${path.extname(filePath).slice(1).toLowerCase()}`;
    const { data } = await agent.uploadBlob(fileBuffer, { encoding: mimeType });
    return data.blob;
}

// Function to create a RichText post with detected links and mentions
async function createRichText(agent: BskyAgent, text: string): Promise<RichText> {
    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
}

// Function to handle posting content with rate limit considerations
async function postContentWithRateLimits(agent: BskyAgent, post: Post) {
    try {
        await manageRateLimits(); // Ensure we're not exceeding request rate limits
        await checkPointLimits(); // Ensure we're not exceeding point limits

        const record: Partial<any> = {
            $type: 'app.bsky.feed.post',
            createdAt: post.createAt || new Date().toISOString(),
        };

        if (post.text) {
            const rt = await createRichText(agent, post.text);
            record.text = rt.text;
            record.facets = rt.facets;
            trackPoints('CREATE');
        } else {
            record.text = '';
        }

        if (post.thumbnail) {
            const filePath = path.join('img', post.thumbnail);
            // Create an external embed with the thumbnail
            const thumbBlob = await uploadBlob(agent, filePath);
            
            record.embed = {
                $type: 'app.bsky.embed.external',
                external: {
                    uri: post.uri,
                    title: post.title || 'Link',
                    description: post.description || '',
                    thumb: thumbBlob
                }
            };
            
            trackPoints('CREATE');
        }

        await agent.post(record as any);
        console.log(`Posted successfully: ${JSON.stringify(post.text)}`);
        requestsThisMinute++;
    } catch (error) {
        console.error(`Error posting: ${JSON.stringify(post.text)} -`, error);
    }
}

// Function to process a single account with a single post
async function processAccountPost(account: Account, post: Post): Promise<void> {
    try {
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        
        console.log(`Logging in as ${account.username}...`);
        await agent.login({
            identifier: account.username,
            password: account.password,
        });
        
        console.log(`Posting for account ${account.username}...`);
        await postContentWithRateLimits(agent, post);
        
        // Add a random delay between 3-10 seconds between account processing
        const delay = 3000 + Math.floor(Math.random() * 7000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
    } catch (error) {
        console.error(`Error processing account ${account.username}:`, error);
    }
}

// Main function to manage the warmup process
async function warmup() {
    try {
        console.log('Starting warmup process...');
        
        // Clear the img directory first
        clearImgDirectory();
        
        // Read accounts and uncategorized posts from files
        const accounts: Account[] = readAccountsFromFile('accounts_new.json');
        const uncategorizedPosts: UncategorizedPost[] = readUncategorizedPostsFromFile('uncategorized_posts.json');
        
        console.log(`Found ${accounts.length} accounts and ${uncategorizedPosts.length} uncategorized posts`);
        
        if (accounts.length === 0 || uncategorizedPosts.length === 0) {
            console.error('No accounts or posts found. Check your JSON files.');
            return;
        }
        
        // Download all images first
        console.log('Downloading images...');
        for (const post of uncategorizedPosts) {
            console.log(`Downloading image for post ID ${post.id} from ${post.featured_image}`);
            await downloadImage(post.featured_image, `${post.id}.jpg`);
        }
        
        // Format posts
        const formattedPosts = formatPosts(uncategorizedPosts);
        
        // Determine how to distribute posts to accounts
        const totalPosts = formattedPosts.length;
        const totalAccounts = accounts.length;
        
        console.log(`Distributing ${totalPosts} posts among ${totalAccounts} accounts`);
        
        // Process posts and accounts
        for (let i = 0; i < totalPosts; i++) {
            // Distribute posts evenly among accounts (wrap around if more posts than accounts)
            const accountIndex = i % totalAccounts;
            console.log(`Processing post ${i + 1}/${totalPosts} for account ${accounts[accountIndex].username}`);
            await processAccountPost(accounts[accountIndex], formattedPosts[i]);
        }
        
        console.log('Warmup completed successfully!');
        
    } catch (error) {
        console.error('Error in warmup process:', error);
    }
}

// Run the warmup
warmup();