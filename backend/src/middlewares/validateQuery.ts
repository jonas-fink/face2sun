import type { RequestHandler } from 'express';
import { z } from 'zod';
import { fieldsFromZod } from '#utils';

const validateQuery = <T extends z.ZodType>(schema: T): RequestHandler => {
    return (req, _res, next): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(new Error('Invalid request', { cause: { status: 400, fields: fieldsFromZod(result.error) } }));
            return;
        }
        Object.defineProperty(req, 'query', {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        });
        next();
    };
};

export default validateQuery;
