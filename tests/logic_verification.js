
import path from 'path';
import assert from 'assert';

console.log("🧪 STARTING INTERNAL LOGIC VERIFICATION...\n");

// ==========================================
// 1. VERIFY PATH NORMALIZATION (Crucial for Folder Bug)
// ==========================================
console.log("1. Testing Path Normalization Fix...");

const normalizePath = (inputPath) => {
    let safePath = path.normalize(inputPath).replace(/^(\.\.[\/\\])+/, '').replace(/[\/\\]$/, '').replace(/\\/g, '/');
    if (safePath === '.') safePath = '';
    if (!safePath.startsWith('/')) safePath = '/' + safePath;
    if (safePath === '/') safePath = '/';
    return safePath;
};

const pathTestCases = [
    { input: '/Docs/', expected: '/Docs', desc: 'Strip trailing slash' },
    { input: '/Docs', expected: '/Docs', desc: 'Leave normal path' },
    { input: '/', expected: '/', desc: 'Root path' },
    { input: '/A/B//', expected: '/A/B', desc: 'Double slash at end' },
    { input: 'Docs/', expected: '/Docs', desc: 'Relative with trailing' },
    { input: '../../etc/passwd', expected: '/etc/passwd', desc: 'Directory traversal attempt (neutralized)' }
];

let pathErrors = 0;
pathTestCases.forEach(test => {
    const result = normalizePath(test.input);
    if (result !== test.expected) {
        console.error(`❌ FAILED: ${test.desc} | Input: "${test.input}" -> Expected: "${test.expected}", Got: "${result}"`);
        pathErrors++;
    } else {
        console.log(`✅ PASS: ${test.desc}`);
    }
});

// ==========================================
// 2. VERIFY SEARCH TOKENIZER (Crucial for Search Engine)
// ==========================================
console.log("\n2. Testing Search Tokenizer...");

const STOP_WORDS = new Set(['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
const tokenize = (text) => {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOP_WORDS.has(t));
};

const searchTestCases = [
    { input: 'The quick brown fox', expected: ['quick', 'brown', 'fox'], desc: 'Remove stop words' },
    { input: 'Project_Alpha_v2', expected: ['project_alpha_v2'], desc: 'Preserve underscores/alphanumeric' },
    { input: 'a an the', expected: [], desc: 'Remove all stop words' }
];

let searchErrors = 0;
searchTestCases.forEach(test => {
    const result = tokenize(test.input);
    const resultJson = JSON.stringify(result);
    const expectedJson = JSON.stringify(test.expected);
    if (resultJson !== expectedJson) {
        console.error(`❌ FAILED: ${test.desc} | Input: "${test.input}" -> Expected: ${expectedJson}, Got: ${resultJson}`);
        searchErrors++;
    } else {
        console.log(`✅ PASS: ${test.desc}`);
    }
});

// ==========================================
// REPORT
// ==========================================
console.log("\n════════════════════════════════════");
if (pathErrors === 0 && searchErrors === 0) {
    console.log("✅ ALL INTERNAL SYSTEMS GO. LOGIC IS SOUND.");
} else {
    console.error(`🚨 FAILURES DETECTED: Path=${pathErrors}, Search=${searchErrors}`);
    process.exit(1);
}
