import { z } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            // Format Zod errors
            const formattedErrors = err.errors.map((e) => ({
                field: e.path.slice(1).join('.'), // Remove 'body', 'query', etc from path if clear
                message: e.message,
                location: e.path[0] // 'body', 'query', or 'params'
            }));

            return res.status(400).json({
                status: 'fail',
                message: 'Validation Error',
                errors: formattedErrors
            });
        }
        next(err);
    }
};
