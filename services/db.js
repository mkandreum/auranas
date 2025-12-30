import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.platform === 'win32'
    ? path.join(__dirname, '../data/auranas.db')
    : '/tmp/auranas.db'; // Use /tmp in Docker/Linux to avoid EACCES permission issues

let db = null;
let SQL = null;
let initPromise = null;

// Initialize database - returns promise, caches it
export function initDb() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (db) return db;

        console.log('⏳ Loading sql.js...');
        SQL = await initSqlJs();

        // Ensure data directory exists
        await fs.ensureDir(path.dirname(dbPath));

        // Load existing database or create new one
        if (await fs.pathExists(dbPath)) {
            console.log('📂 Loading existing database...');
            const buffer = await fs.readFile(dbPath);
            db = new SQL.Database(buffer);
        } else {
            console.log('🆕 Creating new database...');
            db = new SQL.Database();
        }

        // Create all tables
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                quota_bytes INTEGER,
                is_active INTEGER DEFAULT 1,
                created_at INTEGER,
                last_login INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                parent_path TEXT DEFAULT '/',
                name TEXT NOT NULL,
                path TEXT UNIQUE NOT NULL,
                size INTEGER,
                type TEXT,
                mime_type TEXT,
                created_at INTEGER,
                modified_at INTEGER,
                thumbnail_path TEXT,
                is_favorite INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                checksum TEXT,
                width INTEGER,
                height INTEGER,
                duration INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                cover_file_id INTEGER,
                is_smart INTEGER DEFAULT 0,
                smart_query TEXT,
                created_at INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS album_files (
                album_id INTEGER,
                file_id INTEGER,
                added_at INTEGER,
                PRIMARY KEY (album_id, file_id)
            )`,
            `CREATE TABLE IF NOT EXISTS shared_links (
                id TEXT PRIMARY KEY,
                file_id INTEGER,
                album_id INTEGER,
                user_id INTEGER,
                password TEXT,
                created_at INTEGER,
                expires_at INTEGER,
                views INTEGER DEFAULT 0,
                max_views INTEGER,
                allow_download INTEGER DEFAULT 1
            )`,
            `CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#fcd34d',
                created_at INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS file_tags (
                file_id INTEGER,
                tag_id INTEGER,
                PRIMARY KEY (file_id, tag_id)
            )`,
            `CREATE TABLE IF NOT EXISTS upload_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                file_name TEXT,
                total_size INTEGER,
                chunks_received INTEGER DEFAULT 0,
                total_chunks INTEGER,
                status TEXT DEFAULT 'pending',
                created_at INTEGER,
                updated_at INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT,
                target_type TEXT,
                target_id INTEGER,
                details TEXT,
                ip_address TEXT,
                created_at INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER
            )`
        ];

        for (const sql of tables) {
            try { db.run(sql); } catch (e) { /* ignore */ }
        }

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_files_path ON files(path)',
            'CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted)',
            'CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite)'
        ];

        for (const sql of indexes) {
            try { db.run(sql); } catch (e) { /* ignore */ }
        }

        saveDb();
        console.log('✅ Database ready');
        return db;
    })();

    return initPromise;
}

// Save database to disk
export function saveDb() {
    if (!db) {
        console.log('[DB] saveDb called but db is null');
        return;
    }
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
        console.log(`[DB] Saved to disk: ${dbPath} (${buffer.length} bytes)`);
    } catch (e) {
        console.error('[DB] Failed to save database:', e);
    }
}

// Ensure DB is ready before any operation
export async function ensureDb() {
    if (!db) await initDb();
    return db;
}

// Wrapper to make sql.js API compatible with better-sqlite3
const dbWrapper = {
    prepare: (sql) => {
        return {
            run: (...args) => {
                if (!db) {
                    throw new Error('Database not initialized. Server must call initDb() before handling requests.');
                }

                try {
                    let params = args;
                    let finalSql = sql;

                    // Handle named parameters (object with @ prefix)
                    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
                        const namedParams = args[0];
                        params = [];
                        finalSql = sql.replace(/@(\w+)/g, (match, name) => {
                            if (name in namedParams) {
                                params.push(namedParams[name]);
                                return '?';
                            }
                            return match;
                        });
                    }

                    // sql.js requires params to be an array or object, not spread
                    // For positional params, we pass them as an array directly
                    console.log(`[DB.run] SQL: ${finalSql.substring(0, 80)}... | Params: ${JSON.stringify(params).substring(0, 50)}`);
                    db.run(finalSql, params);
                    saveDb();
                    console.log(`[DB.run] Success, rows modified: ${db.getRowsModified()}`);

                    // Get last insert id
                    const result = db.exec("SELECT last_insert_rowid() as id");
                    const lastId = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : 0;

                    return {
                        changes: db.getRowsModified(),
                        lastInsertRowid: lastId
                    };
                } catch (e) {
                    console.error(`[DB.run] Error: ${e.message}`);
                    const err = new Error(e.message);
                    if (e.message && e.message.includes('UNIQUE constraint')) {
                        err.code = 'SQLITE_CONSTRAINT_UNIQUE';
                    }
                    throw err;
                }
            },
            get: (...params) => {
                if (!db) {
                    throw new Error('Database not initialized');
                }

                try {
                    const stmt = db.prepare(sql);
                    if (params.length > 0) stmt.bind(params);

                    if (stmt.step()) {
                        const cols = stmt.getColumnNames();
                        const values = stmt.get();
                        const row = {};
                        cols.forEach((col, i) => { row[col] = values[i]; });
                        stmt.free();
                        return row;
                    }
                    stmt.free();
                    return undefined;
                } catch (e) {
                    console.error('DB get error:', e.message);
                    return undefined;
                }
            },
            all: (...params) => {
                if (!db) {
                    throw new Error('Database not initialized');
                }

                try {
                    const stmt = db.prepare(sql);
                    if (params.length > 0) stmt.bind(params);

                    const rows = [];
                    const cols = stmt.getColumnNames();

                    while (stmt.step()) {
                        const values = stmt.get();
                        const row = {};
                        cols.forEach((col, i) => { row[col] = values[i]; });
                        rows.push(row);
                    }
                    stmt.free();
                    return rows;
                } catch (e) {
                    console.error('DB all error:', e.message);
                    return [];
                }
            }
        };
    },
    exec: (sql) => {
        if (!db) throw new Error('Database not initialized');
        db.run(sql);
        saveDb();
    },
    pragma: () => { },
    transaction: (fn) => {
        return (...args) => {
            const result = fn(...args);
            saveDb();
            return result;
        };
    }
};

export default dbWrapper;
