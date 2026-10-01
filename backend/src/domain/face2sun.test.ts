import {
    CHECK_IN_TTL_MS,
    WALK_RADIUS_METERS,
    assertPublic,
    canTakeSpot,
    checkInExpiresAt,
    countsTowardPresence,
    nextPresenceCount,
    pickNearby,
    publicPresence,
    withinWalk,
} from './face2sun.ts';

describe('walk radius', () => {
    it('keeps 1200 meters and drops 1201', () => {
        expect(WALK_RADIUS_METERS).toBe(1200);
        expect(withinWalk(1200)).toBe(true);
        expect(withinWalk(1201)).toBe(false);
    });
});

describe('pickNearby', () => {
    it('returns the nearest three and drops anything farther than a walk', () => {
        const picked = pickNearby([
            { id: 'far', distanceMeters: 1201 },
            { id: 'c', distanceMeters: 800 },
            { id: 'a', distanceMeters: 10 },
            { id: 'edge', distanceMeters: 1200 },
            { id: 'b', distanceMeters: 400 },
        ]);
        expect(picked.map((place) => place.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('check-in expiry', () => {
    const start = new Date('2026-10-01T12:00:00.000Z');

    it('expires three hours after the check-in', () => {
        expect(checkInExpiresAt(start).getTime() - start.getTime()).toBe(CHECK_IN_TTL_MS);
        expect(CHECK_IN_TTL_MS).toBe(3 * 60 * 60 * 1000);
    });

    it('counts a check-in one millisecond before expiry and drops it after', () => {
        const expiresAt = checkInExpiresAt(start);
        expect(countsTowardPresence(expiresAt, new Date(expiresAt.getTime() - 1))).toBe(true);
        expect(countsTowardPresence(expiresAt, expiresAt)).toBe(false);
        expect(countsTowardPresence(expiresAt, new Date(expiresAt.getTime() + 1))).toBe(false);
    });
});

describe('presence count', () => {
    it('adds one only when this member is not already counted', () => {
        expect(nextPresenceCount(2, false)).toBe(3);
        expect(nextPresenceCount(2, true)).toBe(2);
    });

    it('returns only the count', () => {
        expect(publicPresence(1)).toEqual({ presenceCount: 1 });
        expect(Object.keys(publicPresence(1))).toEqual(['presenceCount']);
    });
});

describe('canTakeSpot', () => {
    it('joins, reports already, or reports full', () => {
        expect(canTakeSpot({ spotsTaken: 1, cap: 4, alreadyHolding: false })).toBe('joined');
        expect(canTakeSpot({ spotsTaken: 1, cap: 4, alreadyHolding: true })).toBe('already');
        expect(canTakeSpot({ spotsTaken: 4, cap: 4, alreadyHolding: false })).toBe('full');
    });
});

describe('assertPublic', () => {
    const banned = [
        'memberId',
        'hostId',
        'createdBy',
        'authorId',
        'email',
        'passwordHash',
        'expiresAt',
        'latitude',
        'longitude',
    ] as const;

    it.each(banned)('rejects %s anywhere in the body', (key) => {
        expect(() => assertPublic({ place: { [key]: 'secret' } })).toThrow(key);
    });

    it('accepts a count, a moment, and a ritual', () => {
        expect(() =>
            assertPublic({
                presenceCount: 1,
                moments: [{ id: 'm', text: 'hello', at: '2026-10-01T12:00:00.000Z' }],
                ritual: { title: 'Thursday', recurrence: 'Thursday', spotsTaken: 1, cap: 4 },
            }),
        ).not.toThrow();
    });
});
