import path from 'path';

/**
 * Centralized file extension lists
 */
export const IMAGE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
    '.tiff', '.tif', '.bmp', '.ico',
    '.heic', '.heif',
    '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.srw',
    '.svg', '.eps', '.ai', '.psd'
];

export const VIDEO_EXTENSIONS = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
    '.m4v', '.mpg', '.mpeg', '.m2ts', '.mts', '.ts',
    '.3gp', '.3g2', '.prores', '.mxf', '.vob', '.ogv', '.divx', '.asf', '.rm', '.rmvb'
];

/**
 * MIME type mappings
 */
export const IMAGE_MIMES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
    '.webp': 'image/webp', '.avif': 'image/avif', '.bmp': 'image/bmp', '.ico': 'image/x-icon',
    '.tiff': 'image/tiff', '.tif': 'image/tiff', '.svg': 'image/svg+xml',
    '.heic': 'image/heic', '.heif': 'image/heif',
    '.raw': 'image/x-raw', '.cr2': 'image/x-canon-cr2', '.cr3': 'image/x-canon-cr3',
    '.nef': 'image/x-nikon-nef', '.arw': 'image/x-sony-arw', '.dng': 'image/x-adobe-dng',
    '.orf': 'image/x-olympus-orf', '.rw2': 'image/x-panasonic-rw2', '.pef': 'image/x-pentax-pef',
    '.psd': 'image/vnd.adobe.photoshop'
};

export const VIDEO_MIMES = {
    '.mp4': 'video/mp4', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime', '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
    '.webm': 'video/webm', '.m4v': 'video/x-m4v', '.mpg': 'video/mpeg', '.mpeg': 'video/mpeg',
    '.3gp': 'video/3gpp', '.ts': 'video/mp2t', '.mts': 'video/mp2t', '.m2ts': 'video/mp2t',
    '.ogv': 'video/ogg', '.vob': 'video/dvd'
};

/**
 * Get file type based on extension
 * @param {string} filePath - Path to the file
 * @returns {'image' | 'video' | 'other'}
 */
export const getFileType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    return 'other';
};

/**
 * Get MIME type for a file
 * @param {string} filePath - Path to the file
 * @returns {string} MIME type
 */
export const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return IMAGE_MIMES[ext] || VIDEO_MIMES[ext] || 'application/octet-stream';
};

/**
 * Validate filename for illegal characters
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if valid
 */
export const validateFileName = (filename) => {
    if (!filename || typeof filename !== 'string') return false;

    // Check for illegal characters: / \ : * ? " < > | null bytes
    const illegalChars = /[\/\\:*?"<>|\x00]/;
    if (illegalChars.test(filename)) return false;

    // Check for reserved names on Windows
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    const nameWithoutExt = path.parse(filename).name;
    if (reservedNames.test(nameWithoutExt)) return false;

    // Check for leading/trailing dots or spaces
    if (filename.startsWith('.') || filename.startsWith(' ') ||
        filename.endsWith('.') || filename.endsWith(' ')) return false;

    return true;
};

/**
 * Sanitize and validate a user-provided path
 * @param {string} userPath - User-provided path
 * @param {string} baseDir - Base directory that the path must be within
 * @returns {string} Sanitized absolute path
 * @throws {Error} If path is invalid or attempts directory traversal
 */
export const sanitizePath = (userPath, baseDir) => {
    if (!userPath || typeof userPath !== 'string') {
        throw new Error('Invalid path provided');
    }

    // Normalize the path to remove any .. or . segments
    let normalized = path.normalize(userPath);

    // Remove any leading traversal attempts
    normalized = normalized.replace(/^(\.\.[\\/])+/, '');

    // Ensure it starts with / for virtual paths
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }

    // Resolve to absolute path within base directory
    const absolutePath = path.resolve(baseDir, normalized.slice(1));

    // CRITICAL: Verify the resolved path is still within baseDir
    const normalizedBase = path.resolve(baseDir);
    if (!absolutePath.startsWith(normalizedBase)) {
        throw new Error('Path traversal attempt detected');
    }

    return absolutePath;
};

/**
 * Sanitize virtual path (for database storage)
 * @param {string} virtualPath - Virtual path like /2024/12/
 * @returns {string} Sanitized virtual path
 */
export const sanitizeVirtualPath = (virtualPath) => {
    if (!virtualPath) return '/';

    // Normalize and remove traversal attempts
    let normalized = path.normalize(virtualPath).replace(/^(\.\.[\\/])+/, '');

    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }

    // Convert backslashes to forward slashes for consistency
    normalized = normalized.replace(/\\/g, '/');

    // Remove any double slashes
    normalized = normalized.replace(/\/+/g, '/');

    return normalized;
};
