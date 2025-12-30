import searchService from '../services/searchService.js';

/**
 * Enterprise Search Controller
 * Handles advanced search requests, parameter parsing, and response formatting.
 */

export const search = async (req, res) => {
    const startTime = Date.now();
    try {
        const {
            q,
            type,
            minSize,
            maxSize,
            startDate,
            endDate,
            limit
        } = req.query;

        // 1. Request Validation
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // 2. Prepare Options
        const options = {
            typeFilter: type,
            minSize: minSize ? parseInt(minSize) : undefined,
            maxSize: maxSize ? parseInt(maxSize) : undefined,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 100
        };

        console.log(`[Search] Query: "${q}" User: ${user.username}`, options);

        // 3. Execute Search Service
        const result = searchService.search(user.id, q || '', options);

        // 4. Performance Metrics
        const duration = Date.now() - startTime;
        res.setHeader('X-Search-Latency-Ms', duration);

        // 5. Response
        res.json({
            status: 'ok',
            latency: duration + 'ms',
            ...result
        });

    } catch (error) {
        console.error('[SearchController] Fatal Error:', error);
        res.status(500).json({
            error: 'Search Failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get Search Suggestions (Autocomplete)
 * Scans recent searches and file names for partial matches.
 */
export const suggestions = async (req, res) => {
    try {
        const { q } = req.query;
        const user = req.user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const db = (await import('../services/db.js')).default;

        // Get file name suggestions (prefix match)
        const fileMatches = db.prepare(`
            SELECT DISTINCT name 
            FROM files 
            WHERE user_id = ? AND is_deleted = 0 AND name LIKE ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `).all(user.id, `${q}%`);

        // Get tag suggestions
        const tagMatches = db.prepare(`
            SELECT DISTINCT name 
            FROM tags 
            WHERE user_id = ? AND name LIKE ? 
            LIMIT 5
        `).all(user.id, `${q}%`);

        const suggestions = [
            ...fileMatches.map(f => ({ type: 'file', value: f.name })),
            ...tagMatches.map(t => ({ type: 'tag', value: t.name }))
        ];

        res.json(suggestions);
    } catch (error) {
        console.error('[Suggestions] Error:', error);
        res.json([]);
    }
};
