import { Member } from '#models';
import { hashPassword } from '#utils';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../test/db.ts';

describe('Member', () => {
    beforeAll(connectTestDb);
    afterEach(clearTestDb);
    afterAll(disconnectTestDb);

    it('has no name field', () => {
        expect(Member.schema.path('name')).toBeUndefined();
    });

    it('rejects a duplicate lowercased email', async () => {
        await Member.init();
        const passwordHash = await hashPassword('password12');
        await Member.create({ email: 'Person@Example.com', passwordHash });
        await expect(Member.create({ email: 'person@example.com', passwordHash })).rejects.toMatchObject({
            code: 11000,
        });
    });
});
