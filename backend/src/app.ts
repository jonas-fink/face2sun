import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '#config';
import { errorHandler } from '#middlewares';
import routes from '#routes';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

app.use((_req, _res, next) => {
    next(new Error('Not found', { cause: { status: 404 } }));
});

app.use(errorHandler);

export default app;
