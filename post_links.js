"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("@atproto/api");
var fs = require("fs");
var path = require("path");
var dotenv = require("dotenv");
var axios_1 = require("axios");
dotenv.config();
// Rate limit tracking
var requestsThisMinute = 0;
var pointsThisHour = 0;
var lastRequestTime = Date.now();
var MAX_REQUESTS_PER_MINUTE = 3000;
var MAX_POINTS_PER_HOUR = 5000;
// Function to manage rate limits
function manageRateLimits() {
    return __awaiter(this, void 0, void 0, function () {
        var currentTime, timeElapsed, waitTime_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentTime = Date.now();
                    timeElapsed = currentTime - lastRequestTime;
                    if (timeElapsed >= 60000) { // If it's been more than a minute
                        requestsThisMinute = 0; // Reset requests count
                        lastRequestTime = currentTime;
                    }
                    if (!(requestsThisMinute >= MAX_REQUESTS_PER_MINUTE)) return [3 /*break*/, 2];
                    waitTime_1 = 60000 - timeElapsed;
                    console.log("Rate limit reached. Waiting for ".concat(waitTime_1 / 1000, " seconds."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_1); })];
                case 1:
                    _a.sent(); // Wait before making next request
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
// Function to track points
function trackPoints(actionType) {
    var pointsMap = { CREATE: 3, UPDATE: 2, DELETE: 1 };
    pointsThisHour += pointsMap[actionType];
}
// Function to check point limits before posting
function checkPointLimits() {
    return __awaiter(this, void 0, void 0, function () {
        var waitTime_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(pointsThisHour >= MAX_POINTS_PER_HOUR)) return [3 /*break*/, 2];
                    waitTime_2 = 60 * 60 * 1000 - (Date.now() % (60 * 60 * 1000));
                    console.log("Point limit reached. Waiting for ".concat(waitTime_2 / 1000, " seconds."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_2); })];
                case 1:
                    _a.sent(); // Wait until the next hour
                    pointsThisHour = 0; // Reset points at the start of the new hour
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
// Function to read accounts from JSON file
function readAccountsFromFile(filePath) {
    try {
        var data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error reading accounts file:', error);
        return [];
    }
}
// Function to read uncategorized posts from a JSON file
function readUncategorizedPostsFromFile(filePath) {
    try {
        var data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error reading uncategorized posts file:', error);
        return [];
    }
}
// Function to clear the img directory
function clearImgDirectory() {
    var imgDir = 'img';
    // Create directory if it doesn't exist
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir);
        console.log('Created img directory');
        return;
    }
    // Clear existing files
    var files = fs.readdirSync(imgDir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        fs.unlinkSync(path.join(imgDir, file));
    }
    console.log("Cleared ".concat(files.length, " files from img directory"));
}
// Function to download an image from a URL to the img directory
function downloadImage(url, fileName) {
    return __awaiter(this, void 0, void 0, function () {
        var response, imgPath, writer_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, axios_1.default)({
                            method: 'GET',
                            url: url,
                            responseType: 'stream'
                        })];
                case 1:
                    response = _a.sent();
                    imgPath = path.join('img', fileName);
                    writer_1 = fs.createWriteStream(imgPath);
                    response.data.pipe(writer_1);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            writer_1.on('finish', resolve);
                            writer_1.on('error', reject);
                        })];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error downloading image from ".concat(url, ":"), error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to format posts from uncategorized posts
function formatPosts(uncategorizedPosts) {
    var formattedPosts = [];
    for (var _i = 0, uncategorizedPosts_1 = uncategorizedPosts; _i < uncategorizedPosts_1.length; _i++) {
        var post = uncategorizedPosts_1[_i];
        // Calculate posting time (current time + 5 minutes)
        var postDate = new Date();
        postDate.setMinutes(postDate.getMinutes() + 5);
        formattedPosts.push({
            text: post.title,
            uri: post.link,
            title: post.title,
            description: post.description,
            thumbnail: "".concat(post.id, ".jpg"),
            createAt: postDate.toISOString()
        });
    }
    return formattedPosts;
}
// Function to upload a file as a blob
function uploadBlob(agent, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var fileBuffer, mimeType, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fs.existsSync(filePath)) {
                        throw new Error("File not found: ".concat(filePath));
                    }
                    fileBuffer = fs.readFileSync(filePath);
                    mimeType = "image/".concat(path.extname(filePath).slice(1).toLowerCase());
                    return [4 /*yield*/, agent.uploadBlob(fileBuffer, { encoding: mimeType })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data.blob];
            }
        });
    });
}
// Function to create a RichText post with detected links and mentions
function createRichText(agent, text) {
    return __awaiter(this, void 0, void 0, function () {
        var rt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rt = new api_1.RichText({ text: text });
                    return [4 /*yield*/, rt.detectFacets(agent)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, rt];
            }
        });
    });
}
// Function to handle posting content with rate limit considerations
function postContentWithRateLimits(agent, post) {
    return __awaiter(this, void 0, void 0, function () {
        var record, rt, filePath, thumbBlob, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, manageRateLimits()];
                case 1:
                    _a.sent(); // Ensure we're not exceeding request rate limits
                    return [4 /*yield*/, checkPointLimits()];
                case 2:
                    _a.sent(); // Ensure we're not exceeding point limits
                    record = {
                        $type: 'app.bsky.feed.post',
                        createdAt: post.createAt || new Date().toISOString(),
                    };
                    if (!post.text) return [3 /*break*/, 4];
                    return [4 /*yield*/, createRichText(agent, post.text)];
                case 3:
                    rt = _a.sent();
                    record.text = rt.text;
                    record.facets = rt.facets;
                    trackPoints('CREATE');
                    return [3 /*break*/, 5];
                case 4:
                    record.text = '';
                    _a.label = 5;
                case 5:
                    if (!post.thumbnail) return [3 /*break*/, 7];
                    filePath = path.join('img', post.thumbnail);
                    return [4 /*yield*/, uploadBlob(agent, filePath)];
                case 6:
                    thumbBlob = _a.sent();
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
                    _a.label = 7;
                case 7: return [4 /*yield*/, agent.post(record)];
                case 8:
                    _a.sent();
                    console.log("Posted successfully: ".concat(JSON.stringify(post.text)));
                    requestsThisMinute++;
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    console.error("Error posting: ".concat(JSON.stringify(post.text), " -"), error_2);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Function to process a single account with a single post
function processAccountPost(account, post) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, delay_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
                    console.log("Logging in as ".concat(account.username, "..."));
                    return [4 /*yield*/, agent.login({
                            identifier: account.username,
                            password: account.password,
                        })];
                case 1:
                    _a.sent();
                    console.log("Posting for account ".concat(account.username, "..."));
                    return [4 /*yield*/, postContentWithRateLimits(agent, post)];
                case 2:
                    _a.sent();
                    delay_1 = 3000 + Math.floor(Math.random() * 7000);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error("Error processing account ".concat(account.username, ":"), error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Main function to manage the warmup process
function warmup() {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, uncategorizedPosts, _i, uncategorizedPosts_2, post, formattedPosts, totalPosts, totalAccounts, i, accountIndex, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    console.log('Starting warmup process...');
                    // Clear the img directory first
                    clearImgDirectory();
                    accounts = readAccountsFromFile('accounts.json');
                    uncategorizedPosts = readUncategorizedPostsFromFile('uncategorized_posts.json');
                    console.log("Found ".concat(accounts.length, " accounts and ").concat(uncategorizedPosts.length, " uncategorized posts"));
                    if (accounts.length === 0 || uncategorizedPosts.length === 0) {
                        console.error('No accounts or posts found. Check your JSON files.');
                        return [2 /*return*/];
                    }
                    // Download all images first
                    console.log('Downloading images...');
                    _i = 0, uncategorizedPosts_2 = uncategorizedPosts;
                    _a.label = 1;
                case 1:
                    if (!(_i < uncategorizedPosts_2.length)) return [3 /*break*/, 4];
                    post = uncategorizedPosts_2[_i];
                    console.log("Downloading image for post ID ".concat(post.id, " from ").concat(post.featured_image));
                    return [4 /*yield*/, downloadImage(post.featured_image, "".concat(post.id, ".jpg"))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    formattedPosts = formatPosts(uncategorizedPosts);
                    totalPosts = formattedPosts.length;
                    totalAccounts = accounts.length;
                    console.log("Distributing ".concat(totalPosts, " posts among ").concat(totalAccounts, " accounts"));
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < totalPosts)) return [3 /*break*/, 8];
                    accountIndex = i % totalAccounts;
                    console.log("Processing post ".concat(i + 1, "/").concat(totalPosts, " for account ").concat(accounts[accountIndex].username));
                    return [4 /*yield*/, processAccountPost(accounts[accountIndex], formattedPosts[i])];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('Warmup completed successfully!');
                    return [3 /*break*/, 10];
                case 9:
                    error_4 = _a.sent();
                    console.error('Error in warmup process:', error_4);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Run the warmup
warmup();
