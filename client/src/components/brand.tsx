import type { LightCue } from 'face2sun-shared';
import { LIGHT_CUE_LABELS } from '../lib/labels';
import { CUE_BG } from './ui';

export const Wordmark = () => (
    <span className="inline-flex items-center gap-0.5 font-display text-2xl font-extrabold tracking-[-0.03em]">
        face
        <span
            aria-hidden="true"
            className="inline-flex size-[26px] items-center justify-center rounded-full bg-sun text-lg text-sunink"
        >
            2
        </span>
        <span className="sr-only">2</span>
        sun
    </span>
);

const CUE_PATHS: Record<LightCue, string> = {
    'early-light': 'M3 18h18M7 18a5 5 0 0 1 10 0M12 10V3M9 6l3-3 3 3',
    'morning-quiet': 'M12 4.5v1.5M12 18v1.5M4.5 12H6M18 12h1.5M6.7 6.7l1 1M16.3 16.3l1 1M6.7 17.3l1-1M16.3 7.7l1-1',
    'after-lunch': 'M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
    'late-light': 'M3 18h18M7 18a5 5 0 0 1 10 0M12 3v7M9 7l3 3 3-3',
};

const CUE_SUN: Partial<Record<LightCue, number>> = { 'morning-quiet': 3.5, 'after-lunch': 4.5 };

export const CueIcon = ({ cue, size = 16 }: { cue: LightCue; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {CUE_SUN[cue] && <circle cx="12" cy="12" r={CUE_SUN[cue]} />}
        <path d={CUE_PATHS[cue]} />
    </svg>
);

export const CueChip = ({ cue }: { cue: LightCue }) => (
    <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-sm font-semibold text-ink ${CUE_BG[cue]}`}>
        <CueIcon cue={cue} />
        {LIGHT_CUE_LABELS[cue]}
    </span>
);

/** Twinkling stars, only drawn in night mode. */
export const Stars = ({ points }: { points: [number, number][] }) => (
    <>
        {points.map(([left, top], i) => (
            <span
                key={i}
                aria-hidden="true"
                className="absolute hidden size-[3px] rounded-full bg-ink motion-safe:animate-twinkle dark:block"
                style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(i * 0.7) % 3}s` }}
            />
        ))}
    </>
);
