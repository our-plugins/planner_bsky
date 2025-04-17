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
// Configuration
var ACCOUNTS_FILE = "accounts.json";
var OUTPUT_FILE = "account_status_report.json";
var BATCH_DELAY = 2000; // 2 seconds between batches to avoid rate limits
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, data, agent, results, i, account, status_1, loginResponse, profileResponse, error_1, summary;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Bluesky Account Status Checker ===");
                    accounts = [];
                    try {
                        data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
                        accounts = JSON.parse(data);
                        console.log("Loaded ".concat(accounts.length, " accounts from ").concat(ACCOUNTS_FILE));
                    }
                    catch (error) {
                        console.error("Error loading accounts from ".concat(ACCOUNTS_FILE, ":"), error);
                        process.exit(1);
                    }
                    agent = new api_1.BskyAgent({ service: "https://bsky.social" });
                    results = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < accounts.length)) return [3 /*break*/, 10];
                    account = accounts[i];
                    console.log("\nChecking account ".concat(i + 1, "/").concat(accounts.length, ": ").concat(account.username));
                    status_1 = {
                        username: account.username,
                        active: false,
                        banned: false,
                        spamLabeled: false
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, agent.login({
                            identifier: account.username,
                            password: account.password
                        })];
                case 3:
                    loginResponse = _a.sent();
                    // If login successful, account is active
                    status_1.active = true;
                    status_1.did = loginResponse.data.did;
                    return [4 /*yield*/, agent.getProfile({ actor: status_1.did })];
                case 4:
                    profileResponse = _a.sent();
                    // Check if account has labels
                    if (profileResponse.data.labels && profileResponse.data.labels.length > 0) {
                        status_1.labels = profileResponse.data.labels.map(function (label) { return label.val; });
                        // Check if any label is spam
                        if (status_1.labels.includes('spam')) {
                            status_1.spamLabeled = true;
                        }
                    }
                    // Log out
                    return [4 /*yield*/, agent.logout()];
                case 5:
                    // Log out
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    // Check if error is related to banned account
                    if (error_1.status === 401 && error_1.error === 'AuthenticationRequired') {
                        status_1.banned = true;
                        status_1.error = "Authentication failed - account may be banned";
                    }
                    else {
                        status_1.error = "Error: ".concat(error_1.message || JSON.stringify(error_1));
                    }
                    return [3 /*break*/, 7];
                case 7:
                    // Add to results
                    results.push(status_1);
                    // Show interim status
                    console.log("Status for ".concat(account.username, ":"));
                    console.log("- Active: ".concat(status_1.active));
                    console.log("- Banned: ".concat(status_1.banned));
                    console.log("- Spam labeled: ".concat(status_1.spamLabeled));
                    if (status_1.error) {
                        console.log("- Error: ".concat(status_1.error));
                    }
                    if (!(i < accounts.length - 1)) return [3 /*break*/, 9];
                    console.log("Waiting ".concat(BATCH_DELAY / 1000, " seconds before next account..."));
                    return [4 /*yield*/, delay(BATCH_DELAY)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    i++;
                    return [3 /*break*/, 1];
                case 10:
                    summary = {
                        totalAccounts: accounts.length,
                        activeAccounts: results.filter(function (r) { return r.active; }).length,
                        bannedAccounts: results.filter(function (r) { return r.banned; }).length,
                        spamLabeledAccounts: results.filter(function (r) { return r.spamLabeled; }).length,
                        accountsWithErrors: results.filter(function (r) { return r.error; }).length,
                        checkedAt: new Date().toISOString(),
                        accounts: results
                    };
                    // Save results to file
                    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));
                    console.log("\nAccount status report saved to ".concat(OUTPUT_FILE));
                    // Print summary
                    console.log("\n=== Summary ===");
                    console.log("Total accounts checked: ".concat(summary.totalAccounts));
                    console.log("Active accounts: ".concat(summary.activeAccounts));
                    console.log("Banned accounts: ".concat(summary.bannedAccounts));
                    console.log("Spam labeled accounts: ".concat(summary.spamLabeledAccounts));
                    console.log("Accounts with errors: ".concat(summary.accountsWithErrors));
                    return [2 /*return*/];
            }
        });
    });
}
// Helper function for delays
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
// Run the script
main().catch(function (error) {
    console.error("Unhandled error:", error);
    process.exit(1);
});
