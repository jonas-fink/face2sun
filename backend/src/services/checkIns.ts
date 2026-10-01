import { CheckIn, Place } from '#models';
import { checkInExpiresAt, countsTowardPresence, publicPresence } from '#domain';
import { httpError, isDuplicateKey } from '#utils';
import { presenceCount } from './places.ts';

export async function checkIn(memberId: string, placeId: string): Promise<{ status: 200 | 201; presenceCount: number }> {
    const place = await Place.findById(placeId);
    if (!place) throw httpError(404, 'Place not found');

    const now = new Date();
    const existing = await CheckIn.findOne({ placeId, memberId });
    if (existing && countsTowardPresence(existing.expiresAt, now)) {
        return { status: 200, ...publicPresence(await presenceCount(placeId, now)) };
    }

    const expiresAt = checkInExpiresAt(now);
    if (existing) {
        existing.expiresAt = expiresAt;
        await existing.save();
    } else {
        try {
            await CheckIn.create({ placeId, memberId, expiresAt });
        } catch (err) {
            if (!isDuplicateKey(err)) throw err;
            return { status: 200, ...publicPresence(await presenceCount(placeId, now)) };
        }
    }

    return { status: 201, ...publicPresence(await presenceCount(placeId, now)) };
}
