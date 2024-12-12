"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@atproto/api");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function readPostsFromFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error reading posts file:', error);
        return [];
    }
}
function uploadBlob(agent, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = `image/${path.extname(filePath).slice(1).toLowerCase()}`;
        const { data } = yield agent.uploadBlob(fileBuffer, { encoding: mimeType });
        return data.blob;
    });
}
function createRichText(agent, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const rt = new api_1.RichText({ text });
        yield rt.detectFacets(agent);
        return rt;
    });
}
function postContent(agent, post) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const record = {
                $type: 'app.bsky.feed.post',
                createdAt: new Date().toISOString(),
            };
            if (post.text) {
                const rt = yield createRichText(agent, post.text);
                record.text = rt.text;
                record.facets = rt.facets;
            }
            else {
                record.text = '';
            }
            if (post.imagepath) {
                const filePath = path.join('img', post.imagepath);
                const blob = yield uploadBlob(agent, filePath);
                record.embed = {
                    $type: 'app.bsky.embed.images',
                    images: [
                        {
                            alt: post.text || 'Image Post',
                            image: blob,
                        },
                    ],
                };
            }
            if (post.uri) {
                const embed = {
                    $type: 'app.bsky.embed.external',
                    external: {
                        uri: post.uri,
                        title: post.title || 'Link',
                        description: post.description || '',
                    },
                };
                if (post.thumbnail) {
                    const thumbBlob = yield uploadBlob(agent, post.thumbnail);
                    embed.external.thumb = thumbBlob;
                }
                record.embed = embed;
            }
            yield agent.post(record);
            console.log(`Posted successfully: ${JSON.stringify(post)}`);
        }
        catch (error) {
            console.error(`Error posting: ${JSON.stringify(post)} -`, error);
        }
    });
}
function schedulePosts(agent) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = readPostsFromFile('posts.json');
        let activeJobs = 0;
        yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
            const [year, month, day, hour, minute] = post.createAt.split('-').map(Number);
            const scheduledDate = new Date(year, month - 1, day, hour, minute);
            if (scheduledDate <= new Date()) {
                console.log(`Skipped scheduling post: "${post.text || post.uri}" because the time ${post.createAt} is in the past.`);
                return;
            }
            activeJobs++;
            console.log(`Posting scheduled: "${post.text || post.uri}" at ${post.createAt}`);
            const delay = scheduledDate.getTime() - Date.now();
            yield new Promise((resolve) => setTimeout(resolve, delay));
            yield postContent(agent, post);
            activeJobs--;
            if (activeJobs === 0) {
                console.log('All posts completed. Exiting...');
                process.exit(0);
            }
        })));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
            yield agent.login({
                identifier: process.env.BLUESKY_USERNAME,
                password: process.env.BLUESKY_PASSWORD,
            });
            yield schedulePosts(agent);
        }
        catch (error) {
            console.error('Error initializing Bluesky agent:', error);
            process.exit(1);
        }
    });
}
main();
