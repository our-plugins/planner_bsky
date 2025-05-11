import { BskyAgent, RichText } from '@atproto/api';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Define types
interface Account {
    username: string;
    password: string;
}

interface Post {
    text?: string;
    imagepath?: string;
    alt?: string;
    uri?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    createAt?: string;
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

// Function to read posts from a JSON file
function readPostsFromFile(filePath: string): Post[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading posts file:', error);
        return [];
    }
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
            createdAt: new Date().toISOString(),
        };

        if (post.text) {
            const rt = await createRichText(agent, post.text);
            record.text = rt.text;
            record.facets = rt.facets;
            trackPoints('CREATE');
        } else {
            record.text = '';
        }

        if (post.imagepath) {
            const filePath = path.join('img', post.imagepath);
            const blob = await uploadBlob(agent, filePath);
            record.embed = {
                $type: 'app.bsky.embed.images',
                images: [
                    {
                        alt: post.alt || 'Image Post',
                        image: blob,
                    },
                ],
            };
            trackPoints('CREATE');
        }

        if (post.uri) {
            const embed: any = {
                $type: 'app.bsky.embed.external',
                external: {
                    uri: post.uri,
                    title: post.title || 'Link',
                    description: post.description || '',
                },
            };

            if (post.thumbnail) {
                const thumbPath = path.join('img', post.thumbnail);
                const thumbBlob = await uploadBlob(agent, thumbPath);
                embed.external.thumb = thumbBlob;
            }

            record.embed = embed;
        }

        await agent.post(record as any);
        console.log(`Posted successfully: ${JSON.stringify(post)}`);
        requestsThisMinute++;
    } catch (error) {
        console.error(`Error posting: ${JSON.stringify(post)} -`, error);
    }
}

// Function to process a single account with a post
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
        // Read accounts and posts from files
        const accounts: Account[] = readAccountsFromFile('accounts_new.json');
        const posts: Post[] = readPostsFromFile('posts.json');
        
        console.log(`Found ${accounts.length} accounts and ${posts.length} posts`);
        
        if (accounts.length === 0 || posts.length === 0) {
            console.error('No accounts or posts found. Check your JSON files.');
            return;
        }
        
        console.log(`Will process all ${accounts.length} accounts, cycling through ${posts.length} posts as needed`);
        
        // Process each account, cycling through posts when needed
        for (let i = 0; i < accounts.length; i++) {
            // Get a post using modulo to cycle through available posts
            const postIndex = i % posts.length;
            const post = posts[postIndex];
            
            console.log(`Processing account ${i + 1}/${accounts.length} with post ${postIndex + 1}/${posts.length}`);
            await processAccountPost(accounts[i], post);
        }
        
        console.log('All accounts have posted successfully!');
        
    } catch (error) {
        console.error('Error in warmup process:', error);
    }
}

// Run the warmup
warmup();