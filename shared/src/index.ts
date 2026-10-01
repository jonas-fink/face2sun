import { z } from 'zod';

// Zod schemas shared by backend validation and client forms, plus the types
// inferred from them — define each shape once, here.

export const healthSchema = z.object({
    status: z.literal('ok'),
});

export type Health = z.infer<typeof healthSchema>;
