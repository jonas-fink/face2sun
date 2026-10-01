import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGO_URI: z.string().min(1),
    CLIENT_URL: z.url().default('http://localhost:5173'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error(`Invalid environment:\n${z.prettifyError(result.error)}`);
    process.exit(1);
}

export const env = result.data;
