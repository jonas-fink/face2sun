import type { LightCue } from 'face2sun-shared';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk';

export const buttonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sun px-6 py-2 text-base font-bold text-sunink shadow-[0_12px_24px_-12px_var(--c-shadow)] transition hover:brightness-105 active:scale-[.98] ${focusRing} disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100`;

export const secondaryButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink px-6 py-2 text-base font-semibold text-ink transition hover:bg-ink/5 active:scale-[.98] ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`;

export const smallButtonClass = `inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-ink px-4 py-1 text-sm font-semibold text-ink transition hover:bg-ink/5 ${focusRing}`;

export const inputClass =
    'block min-h-12 w-full rounded-2xl border-[1.5px] border-bark bg-card px-4 py-3 text-base text-ink placeholder:text-bark focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-dusk';

export const labelClass = 'mb-2 block text-sm font-bold text-ink';

export const cardClass = 'rounded-[28px] bg-card p-5 shadow-[0_14px_30px_-20px_var(--c-shadow)]';

export const errorTextClass = 'mt-1 text-sm font-semibold text-error';

export const eyebrowClass = 'text-sm font-bold uppercase tracking-[0.08em] text-dusk';

export const displayClass = 'font-display font-extrabold tracking-[-0.03em]';

export const CUE_BG: Record<LightCue, string> = {
    'early-light': 'bg-cue-early',
    'morning-quiet': 'bg-cue-morning',
    'after-lunch': 'bg-cue-lunch',
    'late-light': 'bg-cue-late',
};
