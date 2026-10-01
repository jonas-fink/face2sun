import { Router } from 'express';
import { loginBodySchema, registerBodySchema } from 'face2sun-shared';
import { env } from '#config';
import { requireMember, validateBody } from '#middlewares';
import { endSession, loginMember, memberEmail, registerMember } from '#services';

const router = Router();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function setSessionCookie(res: import('express').Response, sessionId: string): void {
    res.cookie('sid', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: THIRTY_DAYS_MS,
        secure: env.NODE_ENV === 'production',
    });
}

router.post('/register', validateBody(registerBodySchema), async (req, res, next) => {
    try {
        const result = await registerMember(req.body.email, req.body.password);
        setSessionCookie(res, result.sessionId);
        res.status(201).json({ email: result.email });
    } catch (err) {
        next(err);
    }
});

router.post('/login', validateBody(loginBodySchema), async (req, res, next) => {
    try {
        const result = await loginMember(req.body.email, req.body.password);
        setSessionCookie(res, result.sessionId);
        res.status(200).json({ email: result.email });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', async (req, res, next) => {
    try {
        const sid = (req.cookies as Record<string, string> | undefined)?.sid;
        await endSession(sid);
        res.clearCookie('sid', { path: '/' });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

router.get('/me', requireMember, async (_req, res, next) => {
    try {
        const email = await memberEmail(String(res.locals.memberId));
        res.status(200).json({ email });
    } catch (err) {
        next(err);
    }
});

export default router;
