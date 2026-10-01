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
import { buttonClass, cardClass, errorTextClass } from '../components/ui';
import { LIGHT_CUE_LABELS, formatTime, presenceLabel, signInPath, spotsLabel } from '../lib/labels';
import { useSession } from '../session/useSession';

type PlaceState =
    | { placeId: string; attempt: number; status: 'ok'; place: PublicPlace }
    | { placeId: string; attempt: number; status: 'notFound' }
    | { placeId: string; attempt: number; status: 'error'; message: string };

const BackLink = () => (
    <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium underline">
        Back to nearby places
    </Link>
);

const PlaceView = ({ place, children }: { place: PublicPlace; children?: ReactNode }) => (
    <article className="space-y-5" aria-labelledby="place-heading">
        <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl"
            role="group"
            aria-label={`Photos of ${place.name}`}
        >
            {place.photos.map((photo, index) => (
                <img
                    key={photo.url}
                    src={photo.url}
                    alt={`${place.name}, photo ${index + 1} of ${place.photos.length}`}
                    loading="lazy"
                    className="aspect-4/3 w-full shrink-0 snap-center rounded-xl bg-stone-200 object-cover"
                />
            ))}
        </div>

        <header>
            <h1 id="place-heading" className="text-2xl font-bold">
                {place.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-stone-700">{LIGHT_CUE_LABELS[place.lightCue]}</p>
        </header>

        <p className="whitespace-pre-line text-base">{place.description}</p>

        <section className={cardClass} aria-labelledby="presence-heading">
            <h2 id="presence-heading" className="text-sm font-semibold uppercase tracking-wide text-stone-700">
                Right now
            </h2>
            <p className="mt-1 text-xl font-bold">{presenceLabel(place.presenceCount)}</p>
            {place.presenceCount > 0 && <p className="text-sm text-stone-700">The count fades.</p>}
        </section>

        <section className={cardClass} aria-labelledby="ritual-heading">
            <h2 id="ritual-heading" className="text-lg font-semibold">
                Ritual
            </h2>
            {place.ritual ? (
                <div className="mt-1">
                    <p className="font-medium">{place.ritual.title}</p>
                    <p className="text-sm text-stone-700">{place.ritual.recurrence}</p>
                    <p className="mt-1 text-sm">{spotsLabel(place.ritual)} spots taken</p>
                </div>
            ) : (
                <p className="mt-1 text-sm text-stone-700">No ritual here yet.</p>
            )}
        </section>

        <section className={cardClass} aria-labelledby="light-heading">
            <h2 id="light-heading" className="text-lg font-semibold">
                Light left here
            </h2>
            {place.light ? (
                <div className="mt-1">
                    <p>{place.light.text}</p>
                    <p className="text-sm text-stone-700">
                        <time dateTime={place.light.at}>{formatTime(place.light.at)}</time>
                    </p>
                </div>
            ) : (
                <p className="mt-1 text-sm text-stone-700">No light left here yet.</p>
            )}
        </section>

        <section aria-labelledby="journal-heading">
            <h2 id="journal-heading" className="text-lg font-semibold">
                Journal
            </h2>
            {place.moments.length === 0 ? (
                <p className="mt-1 text-sm text-stone-700">No moments yet.</p>
            ) : (
                <ul className="mt-2 space-y-3">
                    {place.moments.map((moment) => (
                        <li key={moment.id} className={cardClass}>
                            <p className="whitespace-pre-line">{moment.text}</p>
                            <p className="mt-1 text-sm text-stone-700">
                                <time dateTime={moment.at}>{formatTime(moment.at)}</time>
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>

        {children}
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
            <p role="status" className={cardClass}>
                Loading this place.
            </p>
        );
    } else if (current.status === 'notFound') {
        body = (
            <div className={cardClass}>
                <p role="status" className="font-semibold">
                    Place not found.
                </p>
                <p className="mt-1 text-sm text-stone-700">It may have been removed, or the link is wrong.</p>
            </div>
        );
    } else if (current.status === 'error') {
        body = (
            <div className={cardClass}>
                <p role="alert" className="font-semibold text-red-800">
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
            <PlaceView place={place}>
                <section aria-labelledby="actions-heading" className={`${cardClass} space-y-6`}>
                    <div>
                        <h2 id="actions-heading" className="text-lg font-semibold">
                            Take part
                        </h2>
                        {session.status === 'signedOut' && (
                            <p className="mt-1 text-sm text-stone-700">
                                Writing needs an account. <Link className="font-medium underline" to={signInPath(pathname)}>Sign in</Link> first.
                            </p>
                        )}
                    </div>

                    <div>
                        <button
                            type="button"
                            className={`${buttonClass} w-full`}
                            disabled={pending.checkIn || counted}
                            onClick={() => void handleCheckIn()}
                        >
                            {counted ? "You're counted" : pending.checkIn ? 'Checking in.' : "I'm here"}
                        </button>
                        {errors.checkIn && (
                            <p role="alert" className={errorTextClass}>
                                {errors.checkIn.message}
                            </p>
                        )}
                    </div>

                    <TextWriteForm
                        label="Add a moment to the journal"
                        submitLabel="Add moment"
                        multiline
                        pending={pending.moment}
                        error={errors.moment}
                        onSubmit={handleMoment}
                    />

                    <TextWriteForm
                        label="Leave a light"
                        hint="One line for the next person. It replaces the current one."
                        submitLabel="Leave light"
                        pending={pending.light}
                        error={errors.light}
                        onSubmit={handleLight}
                    />

                    {place.ritual ? (
                        <div>
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
                        </div>
                    ) : (
                        <RitualCreateForm pending={pending.ritual} error={errors.ritual} onSubmit={handleCreateRitual} />
                    )}
                </section>
            </PlaceView>
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
