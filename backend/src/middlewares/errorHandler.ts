import type { ErrorRequestHandler } from 'express';

const statusFor = (err: any): number => {
    if (err.status) return err.status;
    if (err.cause?.status) return err.cause.status;
    if (err.name === 'ValidationError' || err.name === 'CastError') return 400;
    if (err.code === 11000) return 409;
    return 500;
};

const messageFor = (err: any, status: number): string => {
    if (err.name === 'CastError') return `Invalid ${err.path}: ${err.value}`;
    if (err.code === 11000) return `Duplicate value for ${Object.keys(err.keyValue ?? {}).join(', ')}`;
    if (status === 500) return 'Internal Server error';
    return err.message || 'Internal Server error';
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(`\x1b[31m${err.stack}\x1b[0m`);
    } else {
        console.error({ message: err.message, stack: err.stack, status: err.status });
    }

    const status = statusFor(err);
    const cause = err.cause ?? {};

    res.status(status).json({
        message: messageFor(err, status),
        ...(cause.fields ? { fields: cause.fields } : {}),
        ...(cause.extra ?? {}),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

export default errorHandler;
