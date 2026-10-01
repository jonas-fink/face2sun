import { rmSync } from 'node:fs';
import request from 'supertest';
import { Types } from 'mongoose';
import app from './app.ts';
import { assertPublic } from '#domain';
import { CheckIn, Light, Moment, Place, Ritual, RitualSpot } from '#models';
import { clearTestDb, connectTestDb, disconnectTestDb } from './test/db.ts';

const TINY_JPEG =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';

function placeBody(overrides: Record<string, unknown> = {}) {
    return {
        name: 'West Bench',
        description: 'A bench facing the river.',
        lightCue: 'late-light',
        latitude: 52,
        longitude: 13,
        photos: [{ contentType: 'image/jpeg', dataBase64: TINY_JPEG }],
        ...overrides,
    };
}

async function register(email = 'member@example.com') {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/register').send({ email, password: 'password12' });
    return { agent, res };
}

describe('face2sun api', () => {
    beforeAll(connectTestDb);
    afterEach(clearTestDb);
    afterAll(async () => {
        await disconnectTestDb();
        rmSync('uploads', { recursive: true, force: true });
    });

    it('registers, logs in, reads me, and logs out', async () => {
        const { agent, res } = await register('Person@Example.com');
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ email: 'person@example.com' });
        expect(JSON.stringify(res.body)).not.toContain('passwordHash');
        expect(String(res.headers['set-cookie'])).toMatch(/sid=/);
        expect(String(res.headers['set-cookie'])).toMatch(/HttpOnly/i);

        const me = await agent.get('/api/auth/me');
        expect(me.status).toBe(200);
        expect(me.body).toEqual({ email: 'person@example.com' });

        const loggedOut = await agent.post('/api/auth/logout');
        expect(loggedOut.status).toBe(204);
        const after = await agent.get('/api/auth/me');
        expect(after.status).toBe(401);
        expect(after.body.message).toBe('Sign in required');
    });

    it('rejects a short password and a duplicate email', async () => {
        const short = await request(app).post('/api/auth/register').send({ email: 'a@b.co', password: 'short' });
        expect(short.status).toBe(400);
        expect(short.body.fields.password).toEqual(expect.any(String));

        await register('a@b.co');
        const dup = await request(app).post('/api/auth/register').send({ email: 'A@B.co', password: 'password12' });
        expect(dup.status).toBe(409);
        expect(dup.body.message).toBe('An account with that email already exists');
    });

    it('rejects a wrong password', async () => {
        await register('a@b.co');
        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'password99' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Email or password is wrong');
    });

    it('creates a place for a member and refuses a visitor', async () => {
        const visitor = await request(app).post('/api/places').send(placeBody());
        expect(visitor.status).toBe(401);
        expect(await Place.countDocuments()).toBe(0);

        const missing = await (await register()).agent.post('/api/places').send({ lightCue: 'late-light' });
        expect(missing.status).toBe(400);
        expect(missing.body.fields.name).toEqual(expect.any(String));
        expect(missing.body.fields.description).toEqual(expect.any(String));
        expect(missing.body.fields.photos).toEqual(expect.any(String));
        expect(missing.body.fields.location).toEqual(expect.any(String));
        expect(await Place.countDocuments()).toBe(0);

        const { agent } = await register('maker@example.com');
        const created = await agent.post('/api/places').send(placeBody());
        expect(created.status).toBe(201);
        expect(created.body.presenceCount).toBe(0);
        expect(created.body.moments).toEqual([]);
        expect(created.body.light).toBeNull();
        expect(created.body.ritual).toBeNull();
        expect(created.body.photos[0].url).toMatch(/^\/api\/media\//);
        assertPublic(created.body);

        const filename = created.body.photos[0].url.split('/').pop();
        const photo = await request(app).get(`/api/media/${filename}`);
        expect(photo.status).toBe(200);
        expect(photo.headers['content-type']).toMatch(/image\/jpeg/);

        const missingPhoto = await request(app).get('/api/media/nope.jpg');
        expect(missingPhoto.status).toBe(404);
        expect(missingPhoto.body.message).toBe('Photo not found');
    });

    it('checks in as a fading count', async () => {
        const { agent } = await register('a@example.com');
        const place = await agent.post('/api/places').send(placeBody());
        const id = place.body.id;

        const anon = await request(app).post(`/api/places/${id}/check-ins`).send({});
        expect(anon.status).toBe(401);
        expect(await CheckIn.countDocuments()).toBe(0);

        const first = await agent.post(`/api/places/${id}/check-ins`).send({});
        expect(first.status).toBe(201);
        expect(first.body).toEqual({ presenceCount: 1 });
        assertPublic(first.body);

        const again = await agent.post(`/api/places/${id}/check-ins`).send({});
        expect(again.status).toBe(200);
        expect(again.body).toEqual({ presenceCount: 1 });

        await CheckIn.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
        const other = request.agent(app);
        await other.post('/api/auth/register').send({ email: 'b@example.com', password: 'password12' });
        const second = await other.post(`/api/places/${id}/check-ins`).send({});
        expect(second.status).toBe(201);
        expect(second.body).toEqual({ presenceCount: 1 });

        const third = await agent.post(`/api/places/${id}/check-ins`).send({});
        expect(third.status).toBe(201);
        expect(third.body).toEqual({ presenceCount: 2 });

        const unknown = await agent.post(`/api/places/${new Types.ObjectId()}/check-ins`).send({});
        expect(unknown.status).toBe(404);
        expect(unknown.body.message).toBe('Place not found');
    });

    it('writes moments and replaces a light without naming anyone', async () => {
        const { agent } = await register();
        const place = await agent.post('/api/places').send(placeBody());
        const id = place.body.id;

        const empty = await agent.post(`/api/places/${id}/moments`).send({ text: '   ' });
        expect(empty.status).toBe(400);
        expect(empty.body.fields.text).toEqual(expect.any(String));
        expect(await Moment.countDocuments()).toBe(0);

        const anon = await request(app).post(`/api/places/${id}/moments`).send({ text: 'hello' });
        expect(anon.status).toBe(401);

        const moment = await agent.post(`/api/places/${id}/moments`).send({ text: 'The light hits the water at four.' });
        expect(moment.status).toBe(201);
        expect(moment.body.text).toBe('The light hits the water at four.');
        assertPublic(moment.body);

        const seen = await request(app).get(`/api/places/${id}`);
        expect(seen.body.moments).toEqual([moment.body]);
        assertPublic(seen.body);

        const light = await agent.put(`/api/places/${id}/light`).send({ text: 'West bench is in the sun.' });
        expect(light.status).toBe(200);
        assertPublic(light.body);

        const blank = await agent.put(`/api/places/${id}/light`).send({ text: '' });
        expect(blank.status).toBe(400);
        expect(blank.body.fields.text).toEqual(expect.any(String));

        const replaced = await agent.put(`/api/places/${id}/light`).send({ text: 'The west bench is free.' });
        expect(replaced.status).toBe(200);
        expect(replaced.body.text).toBe('The west bench is free.');

        const after = await request(app).get(`/api/places/${id}`);
        expect(after.body.light.text).toBe('The west bench is free.');
        expect(after.body.presenceCount).toBe(0);
    });

    it('keeps one ritual and a capped spot list', async () => {
        const { agent } = await register('host@example.com');
        const place = await agent.post('/api/places').send(placeBody());
        const id = place.body.id;

        const anon = await request(app).post(`/api/places/${id}/ritual`).send({
            title: 'Thursday late light',
            recurrence: 'Thursday late light',
            cap: 2,
        });
        expect(anon.status).toBe(401);

        const created = await agent.post(`/api/places/${id}/ritual`).send({
            title: 'Thursday late light',
            recurrence: 'Thursday late light',
            cap: 2,
        });
        expect(created.status).toBe(201);
        expect(created.body).toEqual({
            title: 'Thursday late light',
            recurrence: 'Thursday late light',
            spotsTaken: 0,
            cap: 2,
        });
        assertPublic(created.body);

        const second = await agent.post(`/api/places/${id}/ritual`).send({
            title: 'Other',
            recurrence: 'Friday',
            cap: 4,
        });
        expect(second.status).toBe(409);
        expect(second.body.message).toBe('This place already has a ritual');

        const join = await agent.post(`/api/places/${id}/ritual/spots`).send({});
        expect(join.status).toBe(201);
        expect(join.body).toEqual({ spotsTaken: 1, cap: 2 });

        const repeat = await agent.post(`/api/places/${id}/ritual/spots`).send({});
        expect(repeat.status).toBe(200);
        expect(repeat.body).toEqual({ spotsTaken: 1, cap: 2 });

        const guest = request.agent(app);
        await guest.post('/api/auth/register').send({ email: 'guest@example.com', password: 'password12' });
        const guestJoin = await guest.post(`/api/places/${id}/ritual/spots`).send({});
        expect(guestJoin.status).toBe(201);
        expect(guestJoin.body.spotsTaken).toBe(2);

        const extra = request.agent(app);
        await extra.post('/api/auth/register').send({ email: 'extra@example.com', password: 'password12' });
        const full = await extra.post(`/api/places/${id}/ritual/spots`).send({});
        expect(full.status).toBe(409);
        expect(full.body.message).toBe('This ritual is full');
        expect(full.body.spotsTaken).toBe(2);
        expect(full.body.cap).toBe(2);

        const missing = await agent.post(`/api/places/${new Types.ObjectId()}/ritual/spots`).send({});
        expect(missing.status).toBe(404);
    });

    it('reads a place with the newest moments and a count of one', async () => {
        const { agent } = await register();
        const place = await agent.post('/api/places').send(placeBody());
        const id = place.body.id;
        await agent.post(`/api/places/${id}/check-ins`).send({});

        for (let i = 0; i < 51; i += 1) {
            await Moment.create({
                placeId: id,
                memberId: new Types.ObjectId(),
                text: `moment ${i}`,
                createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
            });
        }

        const res = await request(app).get(`/api/places/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.presenceCount).toBe(1);
        expect(res.body.moments).toHaveLength(50);
        expect(res.body.moments[0].text).toBe('moment 50');
        expect(res.body.light).toBeNull();
        expect(res.body.ritual).toBeNull();
        assertPublic(res.body);

        const missing = await request(app).get(`/api/places/${new Types.ObjectId()}`);
        expect(missing.status).toBe(404);
        expect(missing.body.message).toBe('Place not found');
    });

    it.each(['garbage', '123', 'garbagegarba', 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
        'answers 404 "Place not found" for the non-ObjectId place id %s and stores nothing',
        async (badId) => {
            const { agent } = await register();
            const place = await agent.post('/api/places').send(placeBody());
            const id = place.body.id;
            await agent.put(`/api/places/${id}/light`).send({ text: 'Original line.' });
            await agent.post(`/api/places/${id}/ritual`).send({ title: 'Ritual', recurrence: 'Weekly', cap: 3 });

            const counts = async () => [
                await Place.countDocuments(),
                await CheckIn.countDocuments(),
                await Moment.countDocuments(),
                await Light.countDocuments(),
                await Ritual.countDocuments(),
                await RitualSpot.countDocuments(),
            ];
            const before = await counts();

            const responses = [
                await request(app).get(`/api/places/${badId}`),
                await agent.post(`/api/places/${badId}/check-ins`).send({}),
                await agent.post(`/api/places/${badId}/moments`).send({ text: 'hello' }),
                await agent.put(`/api/places/${badId}/light`).send({ text: 'Changed line.' }),
                await agent.post(`/api/places/${badId}/ritual`).send({ title: 'Ritual', recurrence: 'Weekly', cap: 3 }),
                await agent.post(`/api/places/${badId}/ritual/spots`).send({}),
            ];
            for (const res of responses) {
                expect(res.status).toBe(404);
                expect(res.body.message).toBe('Place not found');
            }

            expect(await counts()).toEqual(before);
            expect((await Light.findOne())!.text).toBe('Original line.');
        },
    );

    it('lists the three nearest places inside a walk', async () => {
        const { agent } = await register();
        const spots = [
            ['Near', 52, 13],
            ['Mid', 52.002, 13],
            ['Farther', 52.005, 13],
            ['Fourth', 52.009, 13],
            ['Outside', 52.02, 13],
        ] as const;
        for (const [name, latitude, longitude] of spots) {
            const created = await agent.post('/api/places').send(placeBody({ name, latitude, longitude }));
            expect(created.status).toBe(201);
        }
        await agent.post(`/api/places/${(await Place.findOne({ name: 'Near' }))!.id}/ritual`).send({
            title: 'Thursday late light',
            recurrence: 'Thursday late light',
            cap: 4,
        });

        const before = await Place.countDocuments();
        const res = await request(app).get('/api/places/nearby').query({ lat: 52, lng: 13 });
        expect(res.status).toBe(200);
        expect(res.body.places.map((place: { name: string }) => place.name)).toEqual(['Near', 'Mid', 'Farther']);
        expect(res.body.places[0].ritual).toEqual({
            title: 'Thursday late light',
            recurrence: 'Thursday late light',
            spotsTaken: 0,
            cap: 4,
        });
        expect(res.body.places[1].ritual).toBeNull();
        expect(res.body.places[0].presenceCount).toBe(0);
        assertPublic(res.body);
        expect(await Place.countDocuments()).toBe(before);

        const empty = await request(app).get('/api/places/nearby').query({ lat: -70, lng: 40 });
        expect(empty.status).toBe(200);
        expect(empty.body).toEqual({ places: [] });

        const bad = await request(app).get('/api/places/nearby').query({ lat: 91, lng: 13 });
        expect(bad.status).toBe(400);
        expect(bad.body.fields.lat).toEqual(expect.any(String));
    });
});
