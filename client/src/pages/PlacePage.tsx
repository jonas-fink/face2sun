import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import type { PublicPlace } from 'face2sun-shared';
import {
    ApiError,
    checkIn,
    createMoment,
    createRitual,
    getPlace,
    putLight,
    takeSpot,
    type CreateRitualInput,
} from '../api/face2sun';
import RitualCreateForm from '../components/place/RitualCreateForm';
import TextWriteForm from '../components/place/TextWriteForm';
import type { WriteError, WriteKey } from '../components/place/writeTypes';
import { CueChip } from '../components/brand';
import { CUE_BG, buttonClass, cardClass, displayClass, errorTextClass, eyebrowClass, smallButtonClass } from '../components/ui';
import { formatTime, signInPath, spotsLabel } from '../lib/labels';
import { useSession } from '../session/useSession';

type PlaceState =
    | { placeId: string; attempt: number; status: 'ok'; place: PublicPlace }
    | { placeId: string; attempt: number; status: 'notFound' }
    | { placeId: string; attempt: number; status: 'error'; message: string };

const BackLink = () => (
    <Link to="/" className={`${smallButtonClass} gap-1.5 bg-paper`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
        </svg>
        Back to nearby places
    </Link>
);

type Slots = { notice?: ReactNode; checkIn?: ReactNode; light?: ReactNode; ritual?: ReactNode; moment?: ReactNode };

const sectionHeading = 'font-display text-[26px] leading-tight font-bold tracking-[-0.02em]';

const SpotDots = ({ taken, cap }: { taken: number; cap: number }) => (
    <span aria-hidden="true" className="flex flex-wrap gap-2">
        {Array.from({ length: cap }, (_, i) => (
            <span
                key={i}
                className={`size-[22px] rounded-full border-2 transition-colors duration-300 ${i < taken ? 'border-dusk bg-sun' : 'border-dashed border-bark'}`}
            />
        ))}
    </span>
);

const PlaceView = ({ place, slots = {} }: { place: PublicPlace; slots?: Slots }) => (
    <article className="space-y-4" aria-labelledby="place-heading">
        <div
            className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4"
            role="group"
            aria-label={`Photos of ${place.name}`}
        >
            {place.photos.map((photo, index) => (
                <img
                    key={photo.url}
                    src={photo.url}
                    alt={`${place.name}, photo ${index + 1} of ${place.photos.length}`}
                    loading="lazy"
                    className={`aspect-4/3 w-full shrink-0 snap-center rounded-[32px] object-cover ${CUE_BG[place.lightCue]}`}
                />
            ))}
        </div>

        <header className="space-y-3 px-1 pt-2">
            <CueChip cue={place.lightCue} />
            <h1 id="place-heading" className={`${displayClass} text-4xl leading-none`}>
                {place.name}
            </h1>
            <p className="text-base leading-relaxed whitespace-pre-line text-bark">{place.description}</p>
        </header>

        {slots.notice}

        <section className="relative overflow-hidden rounded-[32px] bg-deep p-6 text-on-deep dark:border-[1.5px] dark:border-line" aria-labelledby="presence-heading">
            <div aria-hidden="true" className="absolute -right-20 -bottom-24 size-48 rounded-full border-2 border-dashed border-dusk motion-safe:animate-spin-slow" />
            <h2 id="presence-heading" className="relative text-sm font-bold tracking-[0.08em] text-sun uppercase">
                Right now
            </h2>
            <p className="relative mt-3 flex items-center gap-4">
                <span className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-sun font-display text-[44px] font-extrabold text-sunink motion-safe:animate-breathe">
                    {place.presenceCount}
                </span>
                <span className="font-display text-2xl leading-tight font-bold">
                    {place.presenceCount === 1 ? 'person here now' : 'people here now'}
                </span>
            </p>
            <p className="relative mt-3 text-sm opacity-80">
                {place.presenceCount > 0 ? 'The count fades: each check-in leaves it after about 3 hours.' : 'Quiet right now. Be the first.'}
            </p>
            {slots.checkIn && <div className="relative mt-5">{slots.checkIn}</div>}
        </section>

        <section className="space-y-4 rounded-[32px] bg-cue-morning p-6" aria-labelledby="light-heading">
            <h2 id="light-heading" className={`flex items-center gap-2 ${eyebrowClass}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
                </svg>
                Light left here
            </h2>
            {place.light ? (
                <div className="space-y-2">
                    <blockquote className="font-display text-2xl leading-snug font-medium">“{place.light.text}”</blockquote>
                    <p className="text-sm text-bark">
                        <time dateTime={place.light.at}>{formatTime(place.light.at)}</time>
                    </p>
                </div>
            ) : (
                <p className="text-bark">No light left here yet.</p>
            )}
            {slots.light}
        </section>

        <section className={`${cardClass} space-y-3 p-6`} aria-labelledby="ritual-heading">
            <h2 id="ritual-heading" className={eyebrowClass}>
                Ritual
            </h2>
            {place.ritual ? (
                <div className="space-y-3">
                    <p className={sectionHeading}>{place.ritual.title}</p>
                    <p className="text-bark">{place.ritual.recurrence}</p>
                    <div className="flex items-center gap-3">
                        <SpotDots taken={place.ritual.spotsTaken} cap={place.ritual.cap} />
                    </div>
                    <p className="font-bold">
                        {spotsLabel(place.ritual)} spots taken{place.ritual.spotsTaken >= place.ritual.cap && ' · full'}
                    </p>
                </div>
            ) : (
                <p className="text-bark">No ritual here yet.</p>
            )}
            {slots.ritual}
        </section>

        <section className="space-y-3 pt-4" aria-labelledby="journal-heading">
            <h2 id="journal-heading" className={`${sectionHeading} px-1`}>
                Journal
            </h2>
            {place.moments.length === 0 ? (
                <p className="px-1 text-bark">No moments yet.</p>
            ) : (
                <ul className="space-y-2.5">
                    {place.moments.map((moment) => (
                        <li key={moment.id} className="space-y-1.5 rounded-3xl bg-card px-5 py-4">
                            <p className="leading-relaxed whitespace-pre-line">{moment.text}</p>
                            <p className="text-sm text-bark">
                                <time dateTime={moment.at}>{formatTime(moment.at)}</time>
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            {slots.moment && <div className="rounded-3xl border-2 border-dashed border-line p-4">{slots.moment}</div>}
        </section>
    </article>
);

const NO_PENDING: Record<WriteKey, boolean> = { checkIn: false, moment: false, light: false, ritual: false, spot: false };

const PlaceScreen = ({ placeId }: { placeId: string }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { session, setSignedOut } = useSession();
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState<PlaceState | null>(null);
    const [pending, setPending] = useState<Record<WriteKey, boolean>>(NO_PENDING);
    const [errors, setErrors] = useState<Partial<Record<WriteKey, WriteError>>>({});
    const [counted, setCounted] = useState(false);
    const [holdsSpot, setHoldsSpot] = useState(false);

    const updatePlace = (change: (place: PublicPlace) => PublicPlace) =>
        setState((s) => (s && s.status === 'ok' ? { ...s, place: change(s.place) } : s));

    const runWrite = async <T,>(key: WriteKey, call: () => Promise<T>, apply: (result: T) => void): Promise<boolean> => {
        setPending((p) => ({ ...p, [key]: true }));
        setErrors((e) => ({ ...e, [key]: undefined }));
        try {
            apply(await call());
            return true;
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setSignedOut();
                void navigate(signInPath(pathname));
                return false;
            }
            if (key === 'spot' && err instanceof ApiError && err.status === 409 && err.spotsTaken !== undefined && err.cap !== undefined) {
                const { spotsTaken, cap } = err;
                updatePlace((place) => (place.ritual ? { ...place, ritual: { ...place.ritual, spotsTaken, cap } } : place));
            }
            const error: WriteError =
                err instanceof ApiError
                    ? { message: err.message, fields: err.fields ?? {} }
                    : { message: 'Something went wrong. Try again.', fields: {} };
            setErrors((e) => ({ ...e, [key]: error }));
            return false;
        } finally {
            setPending((p) => ({ ...p, [key]: false }));
        }
    };

    const handleCheckIn = () =>
        runWrite(
            'checkIn',
            () => checkIn(placeId),
            ({ presenceCount }) => {
                updatePlace((place) => ({ ...place, presenceCount }));
                setCounted(true);
            },
        );

    const handleMoment = (text: string) =>
        runWrite(
            'moment',
            () => createMoment(placeId, text),
            (moment) => updatePlace((place) => ({ ...place, moments: [moment, ...place.moments].slice(0, 50) })),
        );

    const handleLight = (text: string) =>
        runWrite(
            'light',
            () => putLight(placeId, text),
            (light) => updatePlace((place) => ({ ...place, light })),
        );

    const handleCreateRitual = (input: CreateRitualInput) =>
        runWrite(
            'ritual',
            () => createRitual(placeId, input),
            (ritual) => updatePlace((place) => ({ ...place, ritual })),
        );

    const handleTakeSpot = () =>
        runWrite(
            'spot',
            () => takeSpot(placeId),
            ({ spotsTaken, cap }) => {
                updatePlace((place) => (place.ritual ? { ...place, ritual: { ...place.ritual, spotsTaken, cap } } : place));
                setHoldsSpot(true);
            },
        );

    useEffect(() => {
        let cancelled = false;
        getPlace(placeId)
            .then((place) => {
                if (!cancelled) setState({ placeId, attempt, status: 'ok', place });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                if (err instanceof ApiError && err.status === 404) {
                    setState({ placeId, attempt, status: 'notFound' });
                } else {
                    setState({
                        placeId,
                        attempt,
                        status: 'error',
                        message: err instanceof Error ? err.message : 'Could not load this place.',
                    });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [placeId, attempt]);

    const current = state && state.placeId === placeId && state.attempt === attempt ? state : null;

    let body;
    if (!current) {
        body = (
            <p role="status" className={`${cardClass} text-bark`}>
                Loading this place.
            </p>
        );
    } else if (current.status === 'notFound') {
        body = (
            <div className={cardClass}>
                <p role="status" className="font-semibold">
                    Place not found.
                </p>
                <p className="mt-1 text-sm text-bark">It may have been removed, or the link is wrong.</p>
            </div>
        );
    } else if (current.status === 'error') {
        body = (
            <div className={cardClass}>
                <p role="alert" className="font-semibold text-error">
                    {current.message}
                </p>
                <button type="button" className={`${buttonClass} mt-3`} onClick={() => setAttempt((n) => n + 1)}>
                    Try again
                </button>
            </div>
        );
    } else {
        const { place } = current;
        body = (
            <PlaceView
                place={place}
                slots={{
                    notice:
                        session.status === 'signedOut' ? (
                            <p className={`${cardClass} text-bark`}>
                                Looking is free. To check in, write or take a spot,{' '}
                                <Link className="font-bold text-dusk underline" to={signInPath(pathname)}>
                                    sign in
                                </Link>{' '}
                                first. Your name never shows.
                            </p>
                        ) : null,
                    checkIn: (
                        <>
                            <button
                                type="button"
                                className={`${buttonClass} w-full`}
                                disabled={pending.checkIn || counted}
                                onClick={() => void handleCheckIn()}
                            >
                                {counted ? "You're counted" : pending.checkIn ? 'Checking in.' : "I'm here"}
                            </button>
                            {errors.checkIn && (
                                <p role="alert" className="mt-2 text-sm font-semibold text-sun">
                                    {errors.checkIn.message}
                                </p>
                            )}
                        </>
                    ),
                    light: (
                        <TextWriteForm
                            label="Leave a light"
                            hint="One line for the next person. It replaces the current one."
                            submitLabel="Leave light"
                            pending={pending.light}
                            error={errors.light}
                            onSubmit={handleLight}
                        />
                    ),
                    ritual: place.ritual ? (
                        <>
                            <button
                                type="button"
                                className={`${buttonClass} w-full`}
                                disabled={pending.spot || holdsSpot}
                                onClick={() => void handleTakeSpot()}
                            >
                                {holdsSpot ? 'You have a spot' : pending.spot ? 'Taking a spot.' : `Take a spot in ${place.ritual.title}`}
                            </button>
                            {errors.spot && (
                                <p role="alert" className={errorTextClass}>
                                    {errors.spot.message}
                                </p>
                            )}
                        </>
                    ) : (
                        <RitualCreateForm pending={pending.ritual} error={errors.ritual} onSubmit={handleCreateRitual} />
                    ),
                    moment: (
                        <TextWriteForm
                            label="Add a moment to the journal"
                            submitLabel="Add moment"
                            multiline
                            pending={pending.moment}
                            error={errors.moment}
                            onSubmit={handleMoment}
                        />
                    ),
                }}
            />
        );
    }

    return (
        <div className="space-y-3">
            <BackLink />
            {body}
        </div>
    );
};

const PlacePage = () => {
    const { placeId = '' } = useParams();
    return <PlaceScreen key={placeId} placeId={placeId} />;
};

export default PlacePage;
