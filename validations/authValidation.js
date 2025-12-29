import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters').max(30),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        adminKey: z.string().optional()
    })
});

export const loginSchema = z.object({
    body: z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required')
    })
});
