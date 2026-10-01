import type { Types } from 'mongoose';
import { Ritual, RitualSpot } from '#models';
import { canTakeSpot } from '#domain';
import { httpError, isDuplicateKey } from '#utils';
import { findPlace } from './places.ts';
import { toPublicRitual } from './public.ts';

async function spotsTaken(ritualId: Types.ObjectId): Promise<number> {
    return RitualSpot.countDocuments({ ritualId });
}

export async function createRitual(
    memberId: string,
    placeId: string,
    input: { title: string; recurrence: string; cap: number },
) {
    await findPlace(placeId);
    try {
        const ritual = await Ritual.create({
            placeId,
            hostId: memberId,
            title: input.title,
            recurrence: input.recurrence,
            cap: input.cap,
        });
        return toPublicRitual(ritual, 0);
    } catch (err) {
        if (isDuplicateKey(err)) throw httpError(409, 'This place already has a ritual');
        throw err;
    }
}

export async function takeSpot(memberId: string, placeId: string): Promise<{ status: 200 | 201; spotsTaken: number; cap: number }> {
    await findPlace(placeId);
    const ritual = await Ritual.findOne({ placeId });
    if (!ritual) throw httpError(404, 'This place has no ritual');

    const existing = await RitualSpot.findOne({ ritualId: ritual._id, memberId });
    const before = await spotsTaken(ritual._id);
    const decision = canTakeSpot({ spotsTaken: before, cap: ritual.cap, alreadyHolding: Boolean(existing) });
    if (decision === 'already') return { status: 200, spotsTaken: before, cap: ritual.cap };
    if (decision === 'full') {
        throw httpError(409, 'This ritual is full', undefined, { spotsTaken: before, cap: ritual.cap });
    }

    try {
        await RitualSpot.create({ ritualId: ritual._id, memberId });
    } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        return { status: 200, spotsTaken: await spotsTaken(ritual._id), cap: ritual.cap };
    }

    const after = await spotsTaken(ritual._id);
    if (after > ritual.cap) {
        await RitualSpot.deleteOne({ ritualId: ritual._id, memberId });
        const current = await spotsTaken(ritual._id);
        throw httpError(409, 'This ritual is full', undefined, { spotsTaken: current, cap: ritual.cap });
    }
    return { status: 201, spotsTaken: after, cap: ritual.cap };
}
