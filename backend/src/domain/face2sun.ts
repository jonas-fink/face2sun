export const WALK_RADIUS_METERS = 1200;
export const CHECK_IN_TTL_MS = 3 * 60 * 60 * 1000;

const BANNED_PUBLIC_KEYS = [
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

export function withinWalk(distanceMeters: number): boolean {
    return distanceMeters <= WALK_RADIUS_METERS;
}

export function pickNearby<T extends { distanceMeters: number }>(candidates: T[]): T[] {
    return candidates
        .filter((candidate) => withinWalk(candidate.distanceMeters))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 3);
}

export function checkInExpiresAt(now: Date): Date {
    return new Date(now.getTime() + CHECK_IN_TTL_MS);
}

export function countsTowardPresence(expiresAt: Date, now: Date): boolean {
    return expiresAt.getTime() > now.getTime();
}

export function nextPresenceCount(count: number, memberAlreadyCounted: boolean): number {
    return memberAlreadyCounted ? count : count + 1;
}

export function publicPresence(count: number): { presenceCount: number } {
    return { presenceCount: count };
}

export function canTakeSpot(input: {
    spotsTaken: number;
    cap: number;
    alreadyHolding: boolean;
}): 'joined' | 'already' | 'full' {
    if (input.alreadyHolding) return 'already';
    if (input.spotsTaken >= input.cap) return 'full';
    return 'joined';
}

export function assertPublic(body: unknown): void {
    walk(body);
}

function walk(value: unknown): void {
    if (Array.isArray(value)) {
        for (const entry of value) walk(entry);
        return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value)) {
        if ((BANNED_PUBLIC_KEYS as readonly string[]).includes(key)) {
            throw new Error(`public body contains ${key}`);
        }
        walk(nested);
    }
}
