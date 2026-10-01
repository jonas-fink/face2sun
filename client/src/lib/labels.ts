import type { LightCue, PublicRitual } from 'face2sun-shared';

export const LIGHT_CUE_LABELS: Record<LightCue, string> = {
    'early-light': 'Early light',
    'morning-quiet': 'Morning quiet',
    'after-lunch': 'After lunch',
    'late-light': 'Late light',
};

export const LIGHT_CUES = Object.keys(LIGHT_CUE_LABELS) as LightCue[];

export const presenceLabel = (count: number): string => (count > 0 ? `${count} here` : 'Quiet');

export const spotsLabel = (ritual: Pick<PublicRitual, 'spotsTaken' | 'cap'>): string =>
    `${ritual.spotsTaken} of ${ritual.cap}`;

const timeFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export const formatTime = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : timeFormat.format(date);
};

export const safeNextPath = (next: string | null): string => {
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
    return next;
};

export const signInPath = (next: string): string => `/sign-in?next=${encodeURIComponent(next)}`;
