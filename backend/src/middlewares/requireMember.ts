import type { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import { Session } from '#models';
import { httpError } from '#utils';

const requireMember: RequestHandler = async (req, res, next) => {
    try {
        const sid = (req.cookies as Record<string, string> | undefined)?.sid;
        if (!sid || !isValidObjectId(sid)) {
            next(httpError(401, 'Sign in required'));
            return;
        }
        const session = await Session.findById(sid);
        if (!session || session.expiresAt.getTime() <= Date.now()) {
            next(httpError(401, 'Sign in required'));
            return;
        }
        res.locals.memberId = session.memberId.toString();
        next();
    } catch (err) {
        next(err);
    }
};

export default requireMember;
