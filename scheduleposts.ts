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

// Configuration
const POSTING_INTERVAL_HOURS = 2; // Post every 2 hours
const POSTS_PER_DAY = 12; // 12 posts per account per day
const POSTING_INTERVAL_MS = POSTING_INTERVAL_HOURS * 60 * 60 * 1000; // 2 hours in milliseconds

// Rate limit tracking
let requestsThisMinute = 0;
let pointsThisHour = 0;
let lastRequestTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 3000;
const MAX_POINTS_PER_HOUR = 5000;

// Global state
let currentPosts: Post[] = [];
let currentPostIndex = 0;
let cycleCount = 0;

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
        console.log(`⏱️  Rate limit reached. Waiting for ${waitTime / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
        const waitTime = 60 * 60 * 1000 - (Date.now() % (60 * 60 * 1000));
        console.log(`⏱️  Point limit reached. Waiting for ${waitTime / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        pointsThisHour = 0;
    }
}

// Function to read accounts from JSON file
function readAccountsFromFile(filePath: string): Account[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading accounts file:', error);
        return [];
    }
}

// Function to read posts from a JSON file
function readPostsFromFile(filePath: string): Post[] {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading posts file:', error);
        return [];
    }
}

// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]; // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Function to get the next post (cycling through posts)
function getNextPost(): Post {
    const post = currentPosts[currentPostIndex];
    currentPostIndex = (currentPostIndex + 1) % currentPosts.length;
    return post;
}

// Function to shuffle posts and reset index
function shufflePosts() {
    console.log(`🔀 Shuffling posts for cycle ${cycleCount + 1}...`);
    currentPosts = shuffleArray(currentPosts);
    currentPostIndex = 0;
    cycleCount++;
    console.log(`📝 Posts shuffled! Starting new cycle with ${currentPosts.length} posts.`);
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
        await manageRateLimits();
        await checkPointLimits();
        
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
        console.log(`✅ Posted successfully: "${post.text?.substring(0, 50)}..."`);
        requestsThisMinute++;
    } catch (error) {
        console.error(`❌ Error posting: "${post.text?.substring(0, 50)}..." -`, error);
    }
}

// Function to post for a single account
async function postForAccount(account: Account): Promise<void> {
    try {
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        
        console.log(`🔐 Logging in as ${account.username}...`);
        await agent.login({
            identifier: account.username,
            password: account.password,
        });
        
        const post = getNextPost();
        console.log(`📝 Posting for ${account.username}...`);
        await postContentWithRateLimits(agent, post);
        
        // Random delay between 1-5 seconds
        const delay = 1000 + Math.floor(Math.random() * 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
    } catch (error) {
        console.error(`❌ Error processing account ${account.username}:`, error);
    }
}

// Function to post for all accounts in one cycle
async function postForAllAccounts(accounts: Account[]): Promise<void> {
    console.log(`\n🚀 Starting posting cycle ${cycleCount + 1}/12 for all ${accounts.length} accounts...`);
    const startTime = Date.now();
    
    for (let i = 0; i < accounts.length; i++) {
        console.log(`\n👤 Processing account ${i + 1}/${accounts.length}: ${accounts[i].username}`);
        await postForAccount(accounts[i]);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n✅ Completed posting cycle in ${duration.toFixed(1)} seconds!`);
}

// Function to format time remaining
function formatTimeRemaining(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

// Function to wait until next posting time
async function waitForNextCycle(): Promise<void> {
    console.log(`\n⏰ Waiting ${POSTING_INTERVAL_HOURS} hours until next posting cycle...`);
    
    const startWait = Date.now();
    const endWait = startWait + POSTING_INTERVAL_MS;
    
    // Show countdown every 30 minutes
    const updateInterval = 30 * 60 * 1000; // 30 minutes
    
    while (Date.now() < endWait) {
        const remaining = endWait - Date.now();
        if (remaining <= 0) break;
        
        console.log(`⏳ Time until next cycle: ${formatTimeRemaining(remaining)}`);
        
        const waitTime = Math.min(updateInterval, remaining);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    console.log(`🔔 2 hours have passed! Starting next cycle...`);
}

// Main function to run the continuous posting system
async function runContinuousPosting() {
    try {
        // Read accounts and posts from files
        const accounts: Account[] = readAccountsFromFile('accounts_warmed.json');
        const originalPosts: Post[] = readPostsFromFile('posts.json');
        
        console.log(`📊 Found ${accounts.length} accounts and ${originalPosts.length} posts`);
        
        if (accounts.length === 0 || originalPosts.length === 0) {
            console.error('❌ No accounts or posts found. Check your JSON files.');
            return;
        }
        
        // Initialize posts (first shuffle)
        currentPosts = shuffleArray(originalPosts);
        currentPostIndex = 0;
        
        console.log(`\n📅 Starting 24-hour posting cycle:`);
        console.log(`   • ${POSTS_PER_DAY} posts per account (every ${POSTING_INTERVAL_HOURS} hours)`);
        console.log(`   • Posts will be shuffled every ${POSTING_INTERVAL_HOURS} hours`);
        console.log(`   • Total duration: 24 hours`);
        
        // Run for 12 cycles (24 hours)
        for (let cycle = 0; cycle < POSTS_PER_DAY; cycle++) {
            console.log(`\n🎯 === CYCLE ${cycle + 1}/${POSTS_PER_DAY} ===`);
            console.log(`📋 Using ${currentPosts.length} posts in current order`);
            
            // Post for all accounts
            await postForAllAccounts(accounts);
            
            // If this isn't the last cycle, wait and shuffle
            if (cycle < POSTS_PER_DAY - 1) {
                await waitForNextCycle();
                shufflePosts();
            }
        }
        
        console.log(`\n🎉 24-hour posting cycle completed successfully!`);
        console.log(`📈 Total posts sent: ${accounts.length * POSTS_PER_DAY}`);
        
    } catch (error) {
        console.error('❌ Error in continuous posting process:', error);
    }
}

// Function to run immediate posting (old behavior for testing)
async function runImmediatePosting() {
    try {
        const accounts: Account[] = readAccountsFromFile('accounts_warmed.json');
        const posts: Post[] = readPostsFromFile('posts.json');
        
        console.log(`📊 Found ${accounts.length} accounts and ${posts.length} posts`);
        
        if (accounts.length === 0 || posts.length === 0) {
            console.error('❌ No accounts or posts found. Check your JSON files.');
            return;
        }
        
        currentPosts = [...posts];
        await postForAllAccounts(accounts);
        
    } catch (error) {
        console.error('❌ Error in immediate posting process:', error);
    }
}

// Main execution
console.log('🤖 Bluesky Auto Poster');
console.log('=====================');
console.log('Choose mode:');
console.log('1. Immediate posting (post once for all accounts now)');
console.log('2. Continuous 24h posting (12 posts per account over 24h)');

// For now, let's default to continuous posting
// You can change this or add command line arguments
const mode = 'continuous'; // Change to 'immediate' for old behavior

if (mode === 'continuous') {
    runContinuousPosting();
} else {
    runImmediatePosting();
}