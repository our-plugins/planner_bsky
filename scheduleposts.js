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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("@atproto/api");
var fs = require("fs");
var path = require("path");
var dotenv = require("dotenv");
dotenv.config();
// Configuration
var POSTING_INTERVAL_HOURS = 2; // Post every 2 hours
var POSTS_PER_DAY = 12; // 12 posts per account per day
var POSTING_INTERVAL_MS = POSTING_INTERVAL_HOURS * 60 * 60 * 1000; // 2 hours in milliseconds
// Rate limit tracking
var requestsThisMinute = 0;
var pointsThisHour = 0;
var lastRequestTime = Date.now();
var MAX_REQUESTS_PER_MINUTE = 3000;
var MAX_POINTS_PER_HOUR = 5000;
// Global state
var currentPosts = [];
var currentPostIndex = 0;
var cycleCount = 0;
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
                    console.log("\u23F1\uFE0F  Rate limit reached. Waiting for ".concat(waitTime_1 / 1000, " seconds."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_1); })];
                case 1:
                    _a.sent();
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
                    console.log("\u23F1\uFE0F  Point limit reached. Waiting for ".concat(waitTime_2 / 1000, " seconds."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_2); })];
                case 1:
                    _a.sent();
                    pointsThisHour = 0;
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
        console.error('❌ Error reading accounts file:', error);
        return [];
    }
}
// Function to read posts from a JSON file
function readPostsFromFile(filePath) {
    try {
        var data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('❌ Error reading posts file:', error);
        return [];
    }
}
// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    var _a;
    var shuffled = __spreadArray([], array, true); // Create a copy
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
    }
    return shuffled;
}
// Function to get the next post (cycling through posts)
function getNextPost() {
    var post = currentPosts[currentPostIndex];
    currentPostIndex = (currentPostIndex + 1) % currentPosts.length;
    return post;
}
// Function to shuffle posts and reset index
function shufflePosts() {
    console.log("\uD83D\uDD00 Shuffling posts for cycle ".concat(cycleCount + 1, "..."));
    currentPosts = shuffleArray(currentPosts);
    currentPostIndex = 0;
    cycleCount++;
    console.log("\uD83D\uDCDD Posts shuffled! Starting new cycle with ".concat(currentPosts.length, " posts."));
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
        var record, rt, filePath, blob, embed, thumbPath, thumbBlob, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, manageRateLimits()];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, checkPointLimits()];
                case 2:
                    _c.sent();
                    record = {
                        $type: 'app.bsky.feed.post',
                        createdAt: new Date().toISOString(),
                    };
                    if (!post.text) return [3 /*break*/, 4];
                    return [4 /*yield*/, createRichText(agent, post.text)];
                case 3:
                    rt = _c.sent();
                    record.text = rt.text;
                    record.facets = rt.facets;
                    trackPoints('CREATE');
                    return [3 /*break*/, 5];
                case 4:
                    record.text = '';
                    _c.label = 5;
                case 5:
                    if (!post.imagepath) return [3 /*break*/, 7];
                    filePath = path.join('img', post.imagepath);
                    return [4 /*yield*/, uploadBlob(agent, filePath)];
                case 6:
                    blob = _c.sent();
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
                    _c.label = 7;
                case 7:
                    if (!post.uri) return [3 /*break*/, 10];
                    embed = {
                        $type: 'app.bsky.embed.external',
                        external: {
                            uri: post.uri,
                            title: post.title || 'Link',
                            description: post.description || '',
                        },
                    };
                    if (!post.thumbnail) return [3 /*break*/, 9];
                    thumbPath = path.join('img', post.thumbnail);
                    return [4 /*yield*/, uploadBlob(agent, thumbPath)];
                case 8:
                    thumbBlob = _c.sent();
                    embed.external.thumb = thumbBlob;
                    _c.label = 9;
                case 9:
                    record.embed = embed;
                    _c.label = 10;
                case 10: return [4 /*yield*/, agent.post(record)];
                case 11:
                    _c.sent();
                    console.log("\u2705 Posted successfully: \"".concat((_a = post.text) === null || _a === void 0 ? void 0 : _a.substring(0, 50), "...\""));
                    requestsThisMinute++;
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _c.sent();
                    console.error("\u274C Error posting: \"".concat((_b = post.text) === null || _b === void 0 ? void 0 : _b.substring(0, 50), "...\" -"), error_1);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
// Function to post for a single account
function postForAccount(account) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, post, delay_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
                    console.log("\uD83D\uDD10 Logging in as ".concat(account.username, "..."));
                    return [4 /*yield*/, agent.login({
                            identifier: account.username,
                            password: account.password,
                        })];
                case 1:
                    _a.sent();
                    post = getNextPost();
                    console.log("\uD83D\uDCDD Posting for ".concat(account.username, "..."));
                    return [4 /*yield*/, postContentWithRateLimits(agent, post)];
                case 2:
                    _a.sent();
                    delay_1 = 1000 + Math.floor(Math.random() * 4000);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("\u274C Error processing account ".concat(account.username, ":"), error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Function to post for all accounts in one cycle
function postForAllAccounts(accounts) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, i, endTime, duration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n\uD83D\uDE80 Starting posting cycle ".concat(cycleCount + 1, "/12 for all ").concat(accounts.length, " accounts..."));
                    startTime = Date.now();
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < accounts.length)) return [3 /*break*/, 4];
                    console.log("\n\uD83D\uDC64 Processing account ".concat(i + 1, "/").concat(accounts.length, ": ").concat(accounts[i].username));
                    return [4 /*yield*/, postForAccount(accounts[i])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    endTime = Date.now();
                    duration = (endTime - startTime) / 1000;
                    console.log("\n\u2705 Completed posting cycle in ".concat(duration.toFixed(1), " seconds!"));
                    return [2 /*return*/];
            }
        });
    });
}
// Function to format time remaining
function formatTimeRemaining(ms) {
    var hours = Math.floor(ms / (1000 * 60 * 60));
    var minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return "".concat(hours, "h ").concat(minutes, "m ").concat(seconds, "s");
}
// Function to wait until next posting time
function waitForNextCycle() {
    return __awaiter(this, void 0, void 0, function () {
        var startWait, endWait, updateInterval, _loop_1, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n\u23F0 Waiting ".concat(POSTING_INTERVAL_HOURS, " hours until next posting cycle..."));
                    startWait = Date.now();
                    endWait = startWait + POSTING_INTERVAL_MS;
                    updateInterval = 30 * 60 * 1000;
                    _loop_1 = function () {
                        var remaining, waitTime;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    remaining = endWait - Date.now();
                                    if (remaining <= 0)
                                        return [2 /*return*/, "break"];
                                    console.log("\u23F3 Time until next cycle: ".concat(formatTimeRemaining(remaining)));
                                    waitTime = Math.min(updateInterval, remaining);
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime); })];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(Date.now() < endWait)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3:
                    console.log("\uD83D\uDD14 2 hours have passed! Starting next cycle...");
                    return [2 /*return*/];
            }
        });
    });
}
// Main function to run the continuous posting system
function runContinuousPosting() {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, originalPosts, cycle, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    accounts = readAccountsFromFile('accounts_warmed.json');
                    originalPosts = readPostsFromFile('posts.json');
                    console.log("\uD83D\uDCCA Found ".concat(accounts.length, " accounts and ").concat(originalPosts.length, " posts"));
                    if (accounts.length === 0 || originalPosts.length === 0) {
                        console.error('❌ No accounts or posts found. Check your JSON files.');
                        return [2 /*return*/];
                    }
                    // Initialize posts (first shuffle)
                    currentPosts = shuffleArray(originalPosts);
                    currentPostIndex = 0;
                    console.log("\n\uD83D\uDCC5 Starting 24-hour posting cycle:");
                    console.log("   \u2022 ".concat(POSTS_PER_DAY, " posts per account (every ").concat(POSTING_INTERVAL_HOURS, " hours)"));
                    console.log("   \u2022 Posts will be shuffled every ".concat(POSTING_INTERVAL_HOURS, " hours"));
                    console.log("   \u2022 Total duration: 24 hours");
                    cycle = 0;
                    _a.label = 1;
                case 1:
                    if (!(cycle < POSTS_PER_DAY)) return [3 /*break*/, 5];
                    console.log("\n\uD83C\uDFAF === CYCLE ".concat(cycle + 1, "/").concat(POSTS_PER_DAY, " ==="));
                    console.log("\uD83D\uDCCB Using ".concat(currentPosts.length, " posts in current order"));
                    // Post for all accounts
                    return [4 /*yield*/, postForAllAccounts(accounts)];
                case 2:
                    // Post for all accounts
                    _a.sent();
                    if (!(cycle < POSTS_PER_DAY - 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, waitForNextCycle()];
                case 3:
                    _a.sent();
                    shufflePosts();
                    _a.label = 4;
                case 4:
                    cycle++;
                    return [3 /*break*/, 1];
                case 5:
                    console.log("\n\uD83C\uDF89 24-hour posting cycle completed successfully!");
                    console.log("\uD83D\uDCC8 Total posts sent: ".concat(accounts.length * POSTS_PER_DAY));
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error('❌ Error in continuous posting process:', error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Function to run immediate posting (old behavior for testing)
function runImmediatePosting() {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, posts, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    accounts = readAccountsFromFile('accounts_warmed.json');
                    posts = readPostsFromFile('posts.json');
                    console.log("\uD83D\uDCCA Found ".concat(accounts.length, " accounts and ").concat(posts.length, " posts"));
                    if (accounts.length === 0 || posts.length === 0) {
                        console.error('❌ No accounts or posts found. Check your JSON files.');
                        return [2 /*return*/];
                    }
                    currentPosts = __spreadArray([], posts, true);
                    return [4 /*yield*/, postForAllAccounts(accounts)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('❌ Error in immediate posting process:', error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Main execution
console.log('🤖 Bluesky Auto Poster');
console.log('=====================');
console.log('Choose mode:');
console.log('1. Immediate posting (post once for all accounts now)');
console.log('2. Continuous 24h posting (12 posts per account over 24h)');
// For now, let's default to continuous posting
// You can change this or add command line arguments
var mode = 'continuous'; // Change to 'immediate' for old behavior
if (mode === 'continuous') {
    runContinuousPosting();
}
else {
    runImmediatePosting();
}
