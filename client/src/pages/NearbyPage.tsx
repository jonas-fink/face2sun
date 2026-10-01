import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { PublicPlaceCard } from 'face2sun-shared';
import { getNearby } from '../api/face2sun';
import MapStrip from '../components/MapStrip';
import { buttonClass, cardClass, secondaryButtonClass } from '../components/ui';
import { LIGHT_CUE_LABELS, presenceLabel, spotsLabel } from '../lib/labels';

type Geo = { status: 'locating' } | { status: 'denied' } | { status: 'ready'; lat: number; lng: number };

type NearbyResult =
    | { key: string; status: 'ok'; places: PublicPlaceCard[] }
    | { key: string; status: 'error'; message: string };

const hasGeolocation = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

const PlaceRow = ({ place, index }: { place: PublicPlaceCard; index: number }) => (
    <li>
        <Link to={`/places/${place.id}`} className={`${cardClass} block hover:bg-amber-50`}>
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">
                    <span className="mr-2 text-stone-700">{index + 1}.</span>
                    {place.name}
                </h2>
                <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-sm font-medium">{presenceLabel(place.presenceCount)}</span>
            </div>
            <p className="mt-1 text-sm text-stone-700">{LIGHT_CUE_LABELS[place.lightCue]}</p>
            {place.ritual && (
                <p className="mt-2 text-sm">
                    <span className="font-medium">{place.ritual.title}</span>
                    <span className="text-stone-700"> · {spotsLabel(place.ritual)}</span>
                </p>
            )}
        </Link>
    </li>
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
            <p role="status" className={cardClass}>
                Finding places within a walk.
            </p>
        );
    } else if (geo.status === 'denied') {
        body = (
            <div className={cardClass}>
                <p role="status" className="font-semibold">
                    Nearby needs a location.
                </p>
                <p className="mt-1 text-sm text-stone-700">Allow location access for this site in your browser, then try again.</p>
                <button type="button" className={`${buttonClass} mt-3`} onClick={retryLocation}>
                    Try again
                </button>
            </div>
        );
    } else if (!current) {
        body = (
            <p role="status" className={cardClass}>
                Loading places.
            </p>
        );
    } else if (current.status === 'error') {
        body = (
            <div className={cardClass}>
                <p role="alert" className="font-semibold text-red-800">
                    {current.message}
                </p>
                <button type="button" className={`${buttonClass} mt-3`} onClick={() => setNearbyAttempt((n) => n + 1)}>
                    Try again
                </button>
            </div>
        );
    } else if (current.places.length === 0) {
        body = (
            <p role="status" className={cardClass}>
                Nothing within a walk yet.
            </p>
        );
    } else {
        body = (
            <div className="space-y-4">
                <MapStrip places={current.places} />
                <ul className="space-y-3">
                    {current.places.map((place, index) => (
                        <PlaceRow key={place.id} place={place} index={index} />
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <section aria-labelledby="nearby-heading" className="space-y-4">
            <div>
                <h1 id="nearby-heading" className="text-2xl font-bold">
                    Within a walk
                </h1>
                <p className="text-sm text-stone-700">Up to three places, nearest first.</p>
            </div>
            {body}
            <Link to="/places/new" className={`${secondaryButtonClass} w-full`}>
                Add a place
            </Link>
        </section>
    );
};

export default NearbyPage;
