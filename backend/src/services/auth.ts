import { Member, Session } from '#models';
import { hashPassword, httpError, isDuplicateKey, verifyPassword } from '#utils';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export async function registerMember(email: string, password: string): Promise<{ email: string; sessionId: string }> {
    const passwordHash = await hashPassword(password);
    try {
        const member = await Member.create({ email, passwordHash });
        const session = await Session.create({
            memberId: member._id,
            expiresAt: new Date(Date.now() + SESSION_MS),
        });
        return { email: member.email, sessionId: session.id };
    } catch (err) {
        if (isDuplicateKey(err)) {
            throw httpError(409, 'An account with that email already exists');
        }
        throw err;
    }
}

export async function loginMember(email: string, password: string): Promise<{ email: string; sessionId: string }> {
    const member = await Member.findOne({ email: email.toLowerCase() });
    if (!member || !(await verifyPassword(password, member.passwordHash))) {
        throw httpError(401, 'Email or password is wrong');
    }
    const session = await Session.create({
        memberId: member._id,
        expiresAt: new Date(Date.now() + SESSION_MS),
    });
    return { email: member.email, sessionId: session.id };
}

export async function memberEmail(memberId: string): Promise<string> {
    const member = await Member.findById(memberId);
    if (!member) throw httpError(401, 'Sign in required');
    return member.email;
}

export async function endSession(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return;
    await Session.findByIdAndDelete(sessionId);
}
