import { z } from 'zod';

export type HttpCause = {
    status: number;
    fields?: Record<string, string>;
    extra?: Record<string, unknown>;
};

export function httpError(
    status: number,
    message: string,
    fields?: Record<string, string>,
    extra?: Record<string, unknown>,
): Error {
    const cause: HttpCause = { status };
    if (fields && Object.keys(fields).length > 0) cause.fields = fields;
    if (extra) cause.extra = extra;
    return new Error(message, { cause });
}

export function fieldsFromZod(error: z.ZodError): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = String(issue.path[0] ?? 'body');
        if (fields[key] === undefined) fields[key] = issue.message;
    }
    return fields;
}

export function isDuplicateKey(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
