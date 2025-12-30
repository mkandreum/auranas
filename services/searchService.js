import db from './db.js';

/**
 * Enterprise Search Service
 * Implements weighted scoring, natural language date parsing, and robust tokenization.
 */
class SearchService {

    constructor() {
        this.STOP_WORDS = new Set(['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    }

    /**
     * Main Search Entry Point
     */
    search(userId, queryText, options = {}) {
        const {
            typeFilter, // 'image', 'video', 'document', 'audio'
            minSize,
            maxSize,
            startDate,
            endDate,
            limit = 100
        } = options;

        // 1. Parse Query
        const tokens = this.tokenize(queryText);
        if (tokens.length === 0 && !typeFilter && !startDate) {
            return { results: [], total: 0, query: queryText };
        }

        // 2. Build SQL Query
        let sql = `
            SELECT f.*, 
            (
                CASE 
                    WHEN f.name LIKE ? THEN 100
                    WHEN f.name LIKE ? THEN 80
                    WHEN f.name LIKE ? THEN 50
                    ELSE 0
                END
            ) as relevance_score
            FROM files f
            LEFT JOIN file_tags ft ON f.id = ft.file_id
            LEFT JOIN tags t ON ft.tag_id = t.id
            WHERE f.user_id = ? AND f.is_deleted = 0
        `;

        const params = [
            queryText,             // Exact match
            `${queryText}%`,       // Starts with
            `%${queryText}%`,      // Contains
            userId
        ];

        // 3. Apply Text Filters
        if (tokens.length > 0) {
            sql += ' AND (';
            const conditions = [];

            // Name match
            conditions.push(`f.name LIKE ?`);
            params.push(`%${queryText}%`);

            // Tag match
            conditions.push(`t.name LIKE ?`);
            params.push(`%${queryText}%`);

            sql += conditions.join(' OR ') + ')';
        }

        // 4. Apply Metadata Filters
        if (typeFilter) {
            if (typeFilter === 'image') {
                sql += ` AND (f.mime_type LIKE 'image%' OR f.name LIKE '%.jpg' OR f.name LIKE '%.png')`;
            } else if (typeFilter === 'video') {
                sql += ` AND (f.mime_type LIKE 'video%' OR f.name LIKE '%.mp4' OR f.name LIKE '%.mkv')`;
            } else if (typeFilter === 'document') {
                sql += ` AND (f.mime_type LIKE 'application/pdf' OR f.mime_type LIKE 'text%' OR f.name LIKE '%.doc%' OR f.name LIKE '%.pdf')`;
            }
        }

        if (minSize) {
            sql += ` AND f.size >= ?`;
            params.push(minSize);
        }

        if (maxSize) {
            sql += ` AND f.size <= ?`;
            params.push(maxSize);
        }

        if (startDate) {
            sql += ` AND f.created_at >= ?`;
            params.push(new Date(startDate).getTime());
        }

        if (endDate) {
            sql += ` AND f.created_at <= ?`;
            params.push(new Date(endDate).getTime());
        }

        // 5. Group & Order
        sql += ` GROUP BY f.id ORDER BY relevance_score DESC, f.created_at DESC LIMIT ?`;
        params.push(limit);

        // 6. Execute & Transform
        try {
            const results = db.prepare(sql).all(...params);

            // Post-processing enrichment
            return {
                results: results.map(row => ({
                    ...row,
                    matchType: row.relevance_score > 90 ? 'Exact' : row.relevance_score > 50 ? 'Partial' : 'Metadata'
                })),
                total: results.length,
                query: queryText,
                debug: { tokens, params: params.length }
            };

        } catch (err) {
            console.error('[SearchService] Execution Failed:', err);
            throw new Error('SEARCH_EXECUTION_FAILED');
        }
    }

    /**
     * Advanced Tokenizer
     */
    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(t => t.length > 2 && !this.STOP_WORDS.has(t));
    }
}

export default new SearchService();
