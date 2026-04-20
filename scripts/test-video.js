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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var child_process_1 = require("child_process");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, testFileName, testFilePath, projectsRes, projects, testProject, createRes, projectId, formData, fileBuffer, blob, uploadStart, uploadRes, uploadData, uploadEnd, meetingsRes, meetings, found;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('--- TEST VIDEO UPLOAD FLOW ---');
                    baseUrl = 'http://localhost:3000';
                    testFileName = 'test_audio_silence.mp3';
                    testFilePath = path_1.default.join(process.cwd(), testFileName);
                    console.log('1. Generating fake audio file...');
                    try {
                        (0, child_process_1.execSync)("ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -q:a 9 -acodec libmp3lame \"".concat(testFilePath, "\" -y"), { stdio: 'pipe' });
                    }
                    catch (e) {
                        console.error('Failed to generate test audio with ffmpeg. Creating a dummy text file instead.');
                        fs_1.default.writeFileSync(testFilePath, 'dummy audio data');
                    }
                    // 2. Mock STT / Ensure API key exists
                    if (!process.env.GEMINI_API_KEY) {
                        console.warn('WARNING: GEMINI_API_KEY is not set. The endpoint will fallback to local Whisper. If whisper is not installed, it will return an error string.');
                    }
                    // Ensure project exists
                    console.log('2. Creating or getting test project...');
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/api/projects"))];
                case 1:
                    projectsRes = _b.sent();
                    return [4 /*yield*/, projectsRes.json()];
                case 2:
                    projects = _b.sent();
                    testProject = projects.find(function (p) { return p.name === 'Test Project Video'; });
                    if (!!testProject) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/api/projects"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: 'Test Project Video', color: 'blue' })
                        })];
                case 3:
                    createRes = _b.sent();
                    return [4 /*yield*/, createRes.json()];
                case 4:
                    testProject = _b.sent();
                    _b.label = 5;
                case 5:
                    projectId = testProject.id;
                    console.log("Using project ID: ".concat(projectId));
                    // 3. Upload file
                    console.log('3. Uploading file to /api/upload/video...');
                    formData = new FormData();
                    fileBuffer = fs_1.default.readFileSync(testFilePath);
                    blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
                    formData.append('file', blob, testFileName);
                    formData.append('project_id', projectId);
                    formData.append('title', 'Automated Test Meeting');
                    formData.append('uploaded_by', 'test_script');
                    uploadStart = Date.now();
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/api/upload/video"), {
                            method: 'POST',
                            body: formData
                        })];
                case 6:
                    uploadRes = _b.sent();
                    return [4 /*yield*/, uploadRes.json()];
                case 7:
                    uploadData = _b.sent();
                    uploadEnd = Date.now();
                    console.log("Upload API Response (".concat(Math.round((uploadEnd - uploadStart) / 1000), "s):"));
                    console.log(JSON.stringify(uploadData, null, 2));
                    // 4. Verification
                    console.log('4. Verifying meeting was created in DB...');
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/api/meetings?project_id=").concat(projectId))];
                case 8:
                    meetingsRes = _b.sent();
                    return [4 /*yield*/, meetingsRes.json()];
                case 9:
                    meetings = _b.sent();
                    found = meetings.find(function (m) { return m.title === 'Automated Test Meeting'; });
                    if (found) {
                        console.log('SUCCESS! Meeting was created in DB.');
                        console.log("Meeting Transcript Preview: ".concat((_a = found.transcript) === null || _a === void 0 ? void 0 : _a.slice(0, 50), "..."));
                    }
                    else {
                        console.error('FAILED! Meeting not found in DB.');
                    }
                    // Cleanup
                    if (fs_1.default.existsSync(testFilePath))
                        fs_1.default.unlinkSync(testFilePath);
                    console.log('--- TEST COMPLETE ---');
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(console.error);
