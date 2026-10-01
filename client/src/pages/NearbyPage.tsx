import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { PublicPlaceCard } from 'face2sun-shared';
import { getNearby } from '../api/face2sun';
import MapStrip from '../components/MapStrip';
import { CueChip, CueIcon } from '../components/brand';
import { CUE_BG, buttonClass, cardClass, displayClass, eyebrowClass } from '../components/ui';
import { greeting, presenceLabel, spotsLabel } from '../lib/labels';

type Geo = { status: 'locating' } | { status: 'denied' } | { status: 'ready'; lat: number; lng: number };

type NearbyResult =
    | { key: string; status: 'ok'; places: PublicPlaceCard[] }
    | { key: string; status: 'error'; message: string };

const hasGeolocation = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

const PresenceDot = ({ count }: { count: number }) =>
    count > 0 ? (
        <span aria-hidden="true" className="size-2.5 rounded-full bg-ember motion-safe:animate-glow" />
    ) : (
        <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-bark" />
    );

const PlaceRow = ({ place, index }: { place: PublicPlaceCard; index: number }) => (
    <li className="motion-safe:animate-rise" style={{ animationDelay: `${index * 0.13}s` }}>
        <Link
            to={`/places/${place.id}`}
            className={`${cardClass} flex gap-4 transition hover:-translate-y-0.5 hover:-rotate-[.4deg] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk motion-reduce:transition-none`}
        >
            <div className="flex min-w-0 grow flex-col gap-2.5">
                <CueChip cue={place.lightCue} />
                <h2 className="font-display text-[22px] leading-tight font-bold tracking-[-0.02em]">
                    <span className="sr-only">{index + 1}. </span>
                    {place.name}
                </h2>
                <p className="flex items-center gap-2 font-semibold">
                    <PresenceDot count={place.presenceCount} />
                    {presenceLabel(place.presenceCount)}
                </p>
                {place.ritual && (
                    <p className="text-sm text-bark">
                        <span className="font-semibold text-ink">{place.ritual.title}</span> · {spotsLabel(place.ritual)} spots
                        {place.ritual.spotsTaken >= place.ritual.cap && ' · full'}
                    </p>
                )}
            </div>
            <div aria-hidden="true" className={`flex size-16 shrink-0 items-center justify-center self-center rounded-full text-ink ${CUE_BG[place.lightCue]}`}>
                <CueIcon cue={place.lightCue} size={30} />
            </div>
        </Link>
    </li>
);

const StateCard = ({ art, title, children, alert = false }: { art: ReactNode; title: string; children?: ReactNode; alert?: boolean }) => (
    <div className={`${cardClass} flex flex-col items-start gap-3`}>
        <div aria-hidden="true" className="relative h-32 w-full">
            {art}
        </div>
        <p role={alert ? 'alert' : 'status'} className={`font-display text-2xl leading-tight font-bold ${alert ? 'text-error' : ''}`}>
            {title}
        </p>
        {children}
    </div>
);

const SunBehindCloud = () => (
    <>
        <div className="absolute top-2 left-1/2 size-20 rounded-full bg-orb motion-safe:animate-float" />
        <div className="absolute top-12 left-[calc(50%-90px)] h-14 w-44 rounded-full bg-line" />
        <div className="absolute top-6 left-[calc(50%-50px)] size-16 rounded-full bg-line" />
    </>
);

const QuietRings = () => (
    <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute size-32 rounded-full border-[2.5px] border-dashed border-sun motion-safe:animate-spin-slow" />
        <div className="absolute size-20 rounded-full border-2 border-dashed border-line" />
        <div className="size-10 rounded-full bg-sun motion-safe:animate-float" />
    </div>
);

const NearbyPage = () => {
    const [geo, setGeo] = useState<Geo>(() => (hasGeolocation() ? { status: 'locating' } : { status: 'denied' }));
    const [geoAttempt, setGeoAttempt] = useState(0);
    const [nearbyAttempt, setNearbyAttempt] = useState(0);
    const [result, setResult] = useState<NearbyResult | null>(null);

    useEffect(() => {
        if (!hasGeolocation()) return;
        let cancelled = false;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!cancelled) setGeo({ status: 'ready', lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {
                if (!cancelled) setGeo({ status: 'denied' });
            },
            { timeout: 15000, maximumAge: 60000 },
        );
        return () => {
            cancelled = true;
        };
    }, [geoAttempt]);

    const lat = geo.status === 'ready' ? geo.lat : null;
    const lng = geo.status === 'ready' ? geo.lng : null;
    const key = lat === null || lng === null ? null : `${lat},${lng},${nearbyAttempt}`;

    useEffect(() => {
        if (lat === null || lng === null || key === null) return;
        let cancelled = false;
        getNearby(lat, lng)
            .then(({ places }) => {
                if (!cancelled) setResult({ key, status: 'ok', places });
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setResult({ key, status: 'error', message: err instanceof Error ? err.message : 'Could not load places.' });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [lat, lng, key]);

    const retryLocation = () => {
        setGeo({ status: 'locating' });
        setGeoAttempt((n) => n + 1);
    };

    const current = result && result.key === key ? result : null;

    let body;
    if (geo.status === 'locating') {
        body = (
            <p role="status" className={`${cardClass} text-bark`}>
                Finding places within a walk.
            </p>
        );
    } else if (geo.status === 'denied') {
        body = (
            <StateCard art={<SunBehindCloud />} title="Nearby needs a location.">
                <p className="text-bark">
                    It is only used to find places within a 15-minute walk, and it is not saved. Allow location access for this site in your
                    browser, then try again.
                </p>
                <button type="button" className={buttonClass} onClick={retryLocation}>
                    Try again
                </button>
            </StateCard>
        );
    } else if (!current) {
        body = (
            <p role="status" className={`${cardClass} text-bark`}>
                Loading places.
            </p>
        );
    } else if (current.status === 'error') {
        body = (
            <StateCard art={<SunBehindCloud />} title={current.message} alert>
                <button type="button" className={buttonClass} onClick={() => setNearbyAttempt((n) => n + 1)}>
                    Try again
                </button>
            </StateCard>
        );
    } else if (current.places.length === 0) {
        body = (
            <StateCard art={<QuietRings />} title="Nothing within a walk yet.">
                <p className="text-bark">You know one: a bench, a step, a corner that catches the light.</p>
            </StateCard>
        );
    } else {
        body = (
            <div className="space-y-4">
                <MapStrip places={current.places} />
                <ul className="space-y-3.5">
                    {current.places.map((place, index) => (
                        <PlaceRow key={place.id} place={place} index={index} />
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <section aria-labelledby="nearby-heading" className="space-y-6">
            <div className="space-y-2 pt-6">
                <p className={eyebrowClass}>{greeting(new Date().getHours())}</p>
                <h1 id="nearby-heading" className={`${displayClass} text-[40px] leading-none`}>
                    Within a walk
                </h1>
                <p className="text-bark">Up to three places, nearest first.</p>
            </div>
            {body}
            <div className="flex justify-center pt-2">
                <Link to="/places/new" className={buttonClass}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add a place
                </Link>
            </div>
        </section>
    );
};

export default NearbyPage;
