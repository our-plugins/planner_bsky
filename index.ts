import { BskyAgent, RichText } from '@atproto/api';
import * as fs from 'fs';
import * as path from 'path';
import { CronJob } from 'cron';
import * as dotenv from 'dotenv';

dotenv.config();

// Define the Post type
interface Post {
    text?: string; // Optional for link previews
    imagepath?: string; // Optional for image posts
    uri?: string; // Optional for external link posts
    title?: string; // Optional title for link previews
    description?: string; // Optional description for link previews
    thumbnail?: string; // Optional thumbnail for link previews
    createAt: string; // Scheduled time for posting
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

// Function to handle posting content
async function postContent(agent: BskyAgent, post: Post) {
    try {
        // Initialize the post record
        const record: Partial<any> = {
            $type: 'app.bsky.feed.post',
            createdAt: new Date().toISOString(),
        };

        // Handle text or RichText posts
        if (post.text) {
            const rt = await createRichText(agent, post.text);
            record.text = rt.text;
            record.facets = rt.facets;
        } else {
            record.text = ''; // Provide default text for non-text posts
        }

        // Handle image posts
        if (post.imagepath) {
            const blob = await uploadBlob(agent, post.imagepath);
            record.embed = {
                $type: 'app.bsky.embed.images',
                images: [
                    {
                        alt: post.text || 'Image Post', // Use text as alt or fallback
                        image: blob,
                    },
                ],
            };
        }

        // Handle external link posts
        if (post.uri) {
            const embed: any = {
                $type: 'app.bsky.embed.external',
                external: {
                    uri: post.uri,
                    title: post.title || 'Link',
                    description: post.description || '',
                },
            };

            // Upload thumbnail if provided
            if (post.thumbnail) {
                const thumbBlob = await uploadBlob(agent, post.thumbnail);
                embed.external.thumb = thumbBlob;
            }

            record.embed = embed;
        }

        // Post the record
        await agent.post(record as any); // Explicit cast to match API requirements
        console.log(`Posted successfully: ${JSON.stringify(post)}`);
    } catch (error) {
        console.error(`Error posting: ${JSON.stringify(post)} -`, error);
    }
}

// Function to schedule posts based on `createAt` time
function schedulePosts(agent: BskyAgent) {
    const posts: Post[] = readPostsFromFile('posts.json'); // Load posts from JSON file

    posts.forEach((post: Post) => {
        const [hour, minute] = post.createAt.split(':').map(Number); // Convert time to numbers
        const cronTime = `${minute} ${hour} * * *`; // Cron format (e.g., '35 20 * * *')

        // Schedule the job
        const job = new CronJob(cronTime, () => postContent(agent, post));
        job.start();
        console.log(`Scheduled post: "${post.text || post.uri}" at ${post.createAt}`);
    });
}

// Main function
async function main() {
    try {
        // Initialize the Bluesky agent and login
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: process.env.BLUESKY_USERNAME!,
            password: process.env.BLUESKY_PASSWORD!,
        });

        // Schedule posts
        schedulePosts(agent);
    } catch (error) {
        console.error('Error initializing Bluesky agent:', error);
    }
}

// Start the script
main();


// import { BskyAgent, RichText } from '@atproto/api';
// import * as fs from 'fs';
// import * as path from 'path';
// import { CronJob } from 'cron';
// import * as dotenv from 'dotenv';

// dotenv.config();

// // Define the Post type
// interface Post {
//     text?: string; // Optional for cases like link previews
//     imagepath?: string; // Optional for posts without images
//     uri?: string; // Optional for external link posts
//     title?: string; // Optional title for link previews
//     description?: string; // Optional description for link previews
//     thumbnail?: string; // Optional thumbnail for link previews
//     createAt: string; // Scheduled time for posting
// }

// // Function to read posts from a JSON file
// function readPostsFromFile(filePath: string): Post[] {
//     try {
//         const data = fs.readFileSync(filePath, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Error reading posts file:', error);
//         return [];
//     }
// }

// // Function to upload an image or thumbnail as a blob
// async function uploadBlob(agent: BskyAgent, filePath: string): Promise<any> {
//     if (!fs.existsSync(filePath)) {
//         throw new Error(`File not found: ${filePath}`);
//     }
//     const fileBuffer = fs.readFileSync(filePath);
//     const mimeType = `image/${path.extname(filePath).slice(1).toLowerCase()}`;
//     const { data } = await agent.uploadBlob(fileBuffer, { encoding: mimeType });
//     return data.blob;
// }

// // Function to detect links and mentions and create a RichText post
// async function createRichText(agent: BskyAgent, text: string): Promise<RichText> {
//     const rt = new RichText({ text });
//     await rt.detectFacets(agent);
//     return rt;
// }

// // Function to handle posting content
// async function postContent(agent: BskyAgent, post: Post) {
//     try {
//         const record: Partial<any> = {
//             $type: 'app.bsky.feed.post',
//             createdAt: new Date().toISOString(),
//         };

//         // Handle text posts or RichText with facets
//         if (post.text) {
//             const rt = await createRichText(agent, post.text);
//             record.text = rt.text;
//             record.facets = rt.facets;
//         } else {
//             record.text = ''; // Default empty text for posts with no text
//         }

//         // Handle image posts
//         if (post.imagepath) {
//             const blob = await uploadBlob(agent, post.imagepath);
//             record.embed = {
//                 $type: 'app.bsky.embed.images',
//                 images: [
//                     {
//                         alt: post.text || 'Image Post', // Use text as alt or fallback
//                         image: blob,
//                         // aspectRatio: { width: 1000, height: 500 },
//                     },
//                 ],
//             };
//         }

//         // Handle external link posts
//         if (post.uri) {
//             const embed: any = {
//                 $type: 'app.bsky.embed.external',
//                 external: {
//                     uri: post.uri,
//                     title: post.title || 'Link',
//                     description: post.description || '',
//                 },
//             };

//             // If a thumbnail is provided, upload it and add it to the embed
//             if (post.thumbnail) {
//                 const thumbBlob = await uploadBlob(agent, post.thumbnail);
//                 embed.external.thumb = thumbBlob;
//             }

//             record.embed = embed;
//         }

//         // Post the record
//         await agent.post(record as any); // Explicitly cast as 'any'
//         console.log(`Posted successfully: ${JSON.stringify(post)}`);
//     } catch (error) {
//         console.error(`Error posting: ${JSON.stringify(post)} -`, error);
//     }
// }

// // Function to schedule posts based on createAt time
// function schedulePosts(agent: BskyAgent) {
//     const posts: Post[] = readPostsFromFile('posts.json'); // Read posts from the JSON file

//     posts.forEach((post: Post) => {
//         const [hour, minute] = post.createAt.split(':').map(Number); // Convert to numbers
//         const cronTime = `${minute} ${hour} * * *`; // Cron time format (e.g., '35 20 * * *')

//         // Schedule the job
//         const job = new CronJob(cronTime, () => postContent(agent, post));
//         job.start();
//         console.log(`Scheduled post: "${post.text || post.uri}" at ${post.createAt}`);
//     });
// }

// // Main function
// async function main() {
//     try {
//         const agent = new BskyAgent({ service: 'https://bsky.social' });

//         // Login to Bluesky
//         await agent.login({
//             identifier: process.env.BLUESKY_USERNAME!,
//             password: process.env.BLUESKY_PASSWORD!,
//         });

//         // Schedule posts from the JSON file
//         schedulePosts(agent);
//     } catch (error) {
//         console.error('Error initializing Bluesky agent:', error);
//     }
// }

// // Start the script
// main();












// =============================================================================== //
// =============================================================================== //
// =============================================================================== //



// import { BskyAgent } from '@atproto/api';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as process from 'process';
// import { CronJob } from 'cron';

// dotenv.config();

// // Create a Bluesky Agent
// const agent = new BskyAgent({
//     service: 'https://bsky.social',
// });

// // Function to read posts from a JSON file
// function readPostsFromFile(filePath: string) {
//     try {
//         const data = fs.readFileSync(filePath, 'utf8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Error reading posts file:', error);
//         return [];
//     }
// }

// // Function to get the base64 string of an image
// function getImageBase64(imagePath: string): { base64: string; mimeType: string } | null {
//     try {
//         const fileBuffer = fs.readFileSync(imagePath);
        
//         // Directly get the MIME type based on the file extension from the imagePath
//         const extension = path.extname(imagePath).toLowerCase();
//         let mimeType = '';
        
//         switch (extension) {
//             case '.png':
//                 mimeType = 'image/png';
//                 break;
//             case '.jpg':
//             case '.jpeg':
//                 mimeType = 'image/jpeg';
//                 break;
//             case '.gif':
//                 mimeType = 'image/gif';
//                 break;
//             case '.webp':
//                 mimeType = 'image/webp';
//                 break;
//             default:
//                 console.error('Unsupported image type');
//                 return null;
//         }

//         const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
//         return { base64, mimeType };
//     } catch (error) {
//         console.error('Error reading image file:', error);
//         return null;
//     }
// }

// // Function to post on Bluesky
// async function postImage(post: { imagepath: string, text: string, createAt: string }) {
//     try {
//         // Login to Bluesky
//         await agent.login({
//             identifier: process.env.BLUESKY_USERNAME!,
//             password: process.env.BLUESKY_PASSWORD!
//         });

//         // Get the base64 image
//         const imageInfo = getImageBase64(post.imagepath);
//         if (!imageInfo) {
//             console.error('Error reading image or no image found.');
//             return;
//         }

//         const { base64, mimeType } = imageInfo;

//         // Upload the image
//         const imageBuffer = Buffer.from(base64.split(',')[1], 'base64'); // Convert base64 to buffer
//         const { data: blobData } = await agent.uploadBlob(imageBuffer, { encoding: mimeType });

//         // Post with the uploaded image
//         await agent.post({
//             text: post.text, // Post text
//             embed: {
//                 $type: 'app.bsky.embed.images',
//                 images: [
//                     {
//                         alt: post.text, // Alt text for accessibility
//                         image: blobData.blob,
//                         aspectRatio: {
//                             width: 1000,
//                             height: 500
//                         }
//                     }
//                 ]
//             },
//             createdAt: new Date().toISOString() // Timestamp of post creation
//         });

//         console.log(`Just posted with an image at ${post.createAt}`);
//     } catch (error) {
//         console.error('Error posting to Bluesky:', error);
//     }
// }

// // Define the Post type
// interface Post {
//     imagepath: string;
//     text: string;
//     createAt: string;
// }

// // Function to schedule posts based on createAt time
// function schedulePosts() {
//     const posts: Post[] = readPostsFromFile('posts.json'); // Read posts from the JSON file

//     posts.forEach((post: Post) => { // Specify the type of 'post' as Post
//         const [hour, minute] = post.createAt.split(':').map(Number); // Split the time and convert to numbers
//         const cronTime = `${minute} ${hour} * * *`; // Format for cron job (e.g., '20 16 * * *' for 16:20)

//         // Schedule the job to post at the specified time
//         const job = new CronJob(cronTime, () => postImage(post)); // Schedule job with the specific post data
//         job.start();
//         console.log(`Scheduled post: ${post.text} at ${post.createAt}`);
//     });
// }


// // Start scheduling the posts
// schedulePosts();


































































// ===========================================================================================
// ********************************** SCHEDULE POSTS *****************************************
// ===========================================================================================


// import { BskyAgent } from '@atproto/api';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as process from 'process';
// import { CronJob } from 'cron';

// dotenv.config();

// // Create a Bluesky Agent
// const agent = new BskyAgent({
//     service: 'https://bsky.social',
// });

// // Posts array with details
// const posts = [
//     {
//         imagepath: "C:\\TypeScript\\img\\mypictuer.jpg",
//         text: "amine lamchatab bsky",
//         createAt: "16:22", // Time to post
//     },
//     {
//         imagepath: "C:\\TypeScript\\img\\mypictuer.jpg",
//         text: "amine lamchatab 2",
//         createAt: "16:40", // Time to post
//     },
// ];

// // Function to get the base64 string of an image
// function getImageBase64(imagePath: string): { base64: string; mimeType: string } | null {
//     try {
//         const fileBuffer = fs.readFileSync(imagePath);
        
//         // Directly get the MIME type based on the file extension from the imagePath
//         const extension = path.extname(imagePath).toLowerCase();
//         let mimeType = '';
        
//         switch (extension) {
//             case '.png':
//                 mimeType = 'image/png';
//                 break;
//             case '.jpg':
//             case '.jpeg':
//                 mimeType = 'image/jpeg';
//                 break;
//             case '.gif':
//                 mimeType = 'image/gif';
//                 break;
//             case '.webp':
//                 mimeType = 'image/webp';
//                 break;
//             default:
//                 console.error('Unsupported image type');
//                 return null;
//         }

//         const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
//         return { base64, mimeType };
//     } catch (error) {
//         console.error('Error reading image file:', error);
//         return null;
//     }
// }


// // Function to post on Bluesky
// async function postImage(post: { imagepath: string, text: string, createAt: string }) {
//     try {
//         // Login to Bluesky
//         await agent.login({
//             identifier: process.env.BLUESKY_USERNAME!,
//             password: process.env.BLUESKY_PASSWORD!
//         });

//         // Get the base64 image
//         const imageInfo = getImageBase64(post.imagepath);
//         if (!imageInfo) {
//             console.error('Error reading image or no image found.');
//             return;
//         }

//         const { base64, mimeType } = imageInfo;

//         // Upload the image
//         const imageBuffer = Buffer.from(base64.split(',')[1], 'base64'); // Convert base64 to buffer
//         const { data: blobData } = await agent.uploadBlob(imageBuffer, { encoding: mimeType });

//         // Post with the uploaded image
//         await agent.post({
//             text: post.text, // Post text
//             embed: {
//                 $type: 'app.bsky.embed.images',
//                 images: [
//                     {
//                         alt: post.text, // Alt text for accessibility
//                         image: blobData.blob,
//                         aspectRatio: {
//                             width: 1000,
//                             height: 500
//                         }
//                     }
//                 ]
//             },
//             createdAt: new Date().toISOString() // Timestamp of post creation
//         });

//         console.log(`Just posted with an image at ${post.createAt}`);
//     } catch (error) {
//         console.error('Error posting to Bluesky:', error);
//     }
// }

// // Function to schedule posts based on createAt time
// function schedulePosts() {
//     posts.forEach((post) => {
//         const [hour, minute] = post.createAt.split(':').map(Number); // Split the time and convert to numbers
//         const cronTime = `${minute} ${hour} * * *`; // Format for cron job (e.g., '20 16 * * *' for 16:20)

//         // Schedule the job to post at the specified time
//         const job = new CronJob(cronTime, () => postImage(post)); // Schedule job with the specific post data
//         job.start();
//         console.log(`Scheduled post: ${post.text} at ${post.createAt}`);
//     });
// }

// // Start scheduling the posts
// schedulePosts();




// ===============================================================================================
// ********************************** END SCHEDULE POSTS *****************************************
// ===============================================================================================







































































































































