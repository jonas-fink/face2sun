import request from 'supertest';
import app from './app.ts';

describe('app', () => {
    it('serves shared-schema routes under /api', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('404s unknown routes through the error handler', async () => {
        const res = await request(app).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Not found');
    });
});
