import { hashPassword, verifyPassword } from './password.ts';

describe('password', () => {
    it('accepts the same password and rejects a different one', async () => {
        const stored = await hashPassword('correct horse');
        expect(await verifyPassword('correct horse', stored)).toBe(true);
        expect(await verifyPassword('wrong horse', stored)).toBe(false);
    });
});
