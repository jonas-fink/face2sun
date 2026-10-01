import type { RequestHandler } from 'express';
import { z } from 'zod';

const validateBody =
    (zodSchema: z.ZodType): RequestHandler =>
    (req, _res, next) => {
        if (!req.body) {
            return next(new Error('Request body is missing', { cause: { status: 400 } }));
        }
        const { data, error, success } = zodSchema.safeParse(req.body);
        if (!success) {
            next(new Error(z.prettifyError(error), { cause: { status: 400 } }));
        } else {
            req.body = data;
            next();
        }
    };

export default validateBody;
