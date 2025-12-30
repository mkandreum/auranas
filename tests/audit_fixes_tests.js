/**
 * Security and Logic Tests for AuraNAS
 * Tests all the fixes implemented in the audit
 */

import { validateFileName, sanitizePath, sanitizeVirtualPath, getFileType, getMimeType } from '../utils/fileUtils.js';
import { formatFileSize, formatDate } from '../src/lib/formatters.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passedTests++;
    } catch (error) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${error.message}`);
        failedTests++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Values not equal'}: expected "${expected}", got "${actual}"`);
    }
}

console.log('\n🔍 Running AuraNAS Security and Logic Tests...\n');

// ===== FILENAME VALIDATION TESTS =====
console.log('📝 Testing Filename Validation...');

test('Valid filename should pass', () => {
    assert(validateFileName('document.pdf'), 'Valid filename rejected');
    assert(validateFileName('my-file_2024.txt'), 'Valid filename with special chars rejected');
});

test('Invalid characters should be rejected', () => {
    assert(!validateFileName('file/name.txt'), 'Forward slash not rejected');
    assert(!validateFileName('file\\name.txt'), 'Backslash not rejected');
    assert(!validateFileName('file:name.txt'), 'Colon not rejected');
    assert(!validateFileName('file*name.txt'), 'Asterisk not rejected');
    assert(!validateFileName('file?name.txt'), 'Question mark not rejected');
    assert(!validateFileName('file"name.txt'), 'Quote not rejected');
    assert(!validateFileName('file<name.txt'), 'Less than not rejected');
    assert(!validateFileName('file>name.txt'), 'Greater than not rejected');
    assert(!validateFileName('file|name.txt'), 'Pipe not rejected');
});

test('Reserved Windows names should be rejected', () => {
    assert(!validateFileName('con.txt'), 'CON not rejected');
    assert(!validateFileName('prn.txt'), 'PRN not rejected');
    assert(!validateFileName('aux.txt'), 'AUX not rejected');
    assert(!validateFileName('nul.txt'), 'NUL not rejected');
    assert(!validateFileName('com1.txt'), 'COM1 not rejected');
});

test('Leading/trailing dots and spaces should be rejected', () => {
    assert(!validateFileName('.hiddenfile'), 'Leading dot not rejected');
    assert(!validateFileName(' file.txt'), 'Leading space not rejected');
    assert(!validateFileName('file.txt '), 'Trailing space not rejected');
    assert(!validateFileName('file.'), 'Trailing dot not rejected');
});

test('Empty or invalid input should be rejected', () => {
    assert(!validateFileName(''), 'Empty string not rejected');
    assert(!validateFileName(null), 'Null not rejected');
    assert(!validateFileName(undefined), 'Undefined not rejected');
});

// ===== PATH SANITIZATION TESTS =====
console.log('\n🔒 Testing Path Sanitization...');

const baseDir = path.join(__dirname, '../storage/testuser');

test('Normal path should be sanitized correctly', () => {
    const result = sanitizePath('/documents/2024', baseDir);
    assert(result.startsWith(baseDir), 'Path not within base directory');
});

test('Directory traversal attempts should be blocked', () => {
    try {
        sanitizePath('../../etc/passwd', baseDir);
        throw new Error('Directory traversal not blocked');
    } catch (e) {
        assert(e.message.includes('traversal'), 'Wrong error message');
    }
});

test('Absolute path traversal should be blocked', () => {
    try {
        sanitizePath('/etc/passwd', baseDir);
        throw new Error('Absolute path traversal not blocked');
    } catch (e) {
        assert(e.message.includes('traversal'), 'Wrong error message');
    }
});

test('Virtual path sanitization should normalize paths', () => {
    assertEquals(sanitizeVirtualPath('/documents/2024'), '/documents/2024');
    assertEquals(sanitizeVirtualPath('documents/2024'), '/documents/2024');
    assertEquals(sanitizeVirtualPath('/documents//2024/'), '/documents/2024');
    assertEquals(sanitizeVirtualPath(''), '/');
    assertEquals(sanitizeVirtualPath(null), '/');
});

test('Virtual path should remove traversal attempts', () => {
    assertEquals(sanitizeVirtualPath('../../../etc'), '/etc');
    assertEquals(sanitizeVirtualPath('/documents/../../../etc'), '/etc');
});

// ===== FILE TYPE DETECTION TESTS =====
console.log('\n📁 Testing File Type Detection...');

test('Image files should be detected correctly', () => {
    assertEquals(getFileType('photo.jpg'), 'image');
    assertEquals(getFileType('image.png'), 'image');
    assertEquals(getFileType('graphic.webp'), 'image');
    assertEquals(getFileType('raw.cr2'), 'image');
});

test('Video files should be detected correctly', () => {
    assertEquals(getFileType('movie.mp4'), 'video');
    assertEquals(getFileType('clip.mkv'), 'video');
    assertEquals(getFileType('video.mov'), 'video');
    assertEquals(getFileType('recording.avi'), 'video');
});

test('Other files should return "other"', () => {
    assertEquals(getFileType('document.pdf'), 'other');
    assertEquals(getFileType('data.json'), 'other');
    assertEquals(getFileType('script.js'), 'other');
});

test('MIME types should be detected correctly', () => {
    assertEquals(getMimeType('photo.jpg'), 'image/jpeg');
    assertEquals(getMimeType('image.png'), 'image/png');
    assertEquals(getMimeType('movie.mp4'), 'video/mp4');
    assertEquals(getMimeType('clip.mkv'), 'video/x-matroska');
    assertEquals(getMimeType('unknown.xyz'), 'application/octet-stream');
});

// ===== FILE SIZE FORMATTING TESTS =====
console.log('\n📊 Testing File Size Formatting...');

test('Bytes should format correctly', () => {
    assertEquals(formatFileSize(0), '0 B');
    assertEquals(formatFileSize(500), '500 B');
    assertEquals(formatFileSize(1023), '1023 B');
});

test('Kilobytes should format correctly', () => {
    assertEquals(formatFileSize(1024), '1 KB');
    assertEquals(formatFileSize(1536), '1.5 KB');
    assertEquals(formatFileSize(10240), '10 KB');
});

test('Megabytes should format correctly', () => {
    assertEquals(formatFileSize(1048576), '1 MB');
    assertEquals(formatFileSize(1572864), '1.5 MB');
    assertEquals(formatFileSize(10485760), '10 MB');
});

test('Gigabytes should format correctly', () => {
    assertEquals(formatFileSize(1073741824), '1 GB');
    assertEquals(formatFileSize(1610612736), '1.5 GB');
});

test('Null/undefined should return "0 B"', () => {
    assertEquals(formatFileSize(null), '0 B');
    assertEquals(formatFileSize(undefined), '0 B');
});

// ===== DATE FORMATTING TESTS =====
console.log('\n📅 Testing Date Formatting...');

test('Valid dates should format correctly', () => {
    const date = new Date('2024-12-30T15:00:00Z');
    const formatted = formatDate(date.getTime());
    assert(formatted.includes('2024'), 'Year not in formatted date');
    assert(formatted.includes('Dec'), 'Month not in formatted date');
});

test('Invalid dates should return "-"', () => {
    assertEquals(formatDate(null), '-');
    assertEquals(formatDate(undefined), '-');
    assertEquals(formatDate('invalid'), '-');
});

// ===== SUMMARY =====
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total:  ${passedTests + failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The fixes are working correctly.\n');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the errors above.\n`);
    process.exit(1);
}
