import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { LightCue } from 'face2sun-shared';
import { ApiError, createPlace } from '../api/face2sun';
import { buttonClass, cardClass, errorTextClass, inputClass, labelClass, secondaryButtonClass, smallButtonClass } from '../components/ui';
import { MAX_PHOTOS, prepareImage, type PreparedPhoto } from '../lib/images';
import { LIGHT_CUES, LIGHT_CUE_LABELS, signInPath } from '../lib/labels';
import { useSession } from '../session/useSession';

type Location = { latitude: number; longitude: number };
type LocationPhase = 'idle' | 'locating' | 'set' | 'failed';
type FormError = { message: string; fields: Record<string, string> };

const FieldError = ({ id, message }: { id: string; message: string | undefined }) =>
    message ? (
        <p id={id} role="alert" className={errorTextClass}>
            {message}
        </p>
    ) : null;

const NewPlacePage = () => {
    const navigate = useNavigate();
    const { setSignedOut } = useSession();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [lightCue, setLightCue] = useState<LightCue>('morning-quiet');
    const [location, setLocation] = useState<Location | null>(null);
    const [locationPhase, setLocationPhase] = useState<LocationPhase>('idle');
    const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<FormError | null>(null);

    const fields = error?.fields ?? {};
    const generalError = error && Object.keys(fields).length === 0 ? error.message : null;
    const locationError = fields.location ?? fields.latitude ?? fields.longitude;
    const photosError = photoError ?? fields.photos;

    const captureLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationPhase('failed');
            return;
        }
        setLocationPhase('locating');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                setLocationPhase('set');
            },
            () => setLocationPhase('failed'),
            { timeout: 15000, enableHighAccuracy: true },
        );
    };

    const handlePhotos = async (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length === 0) return;

        const room = MAX_PHOTOS - photos.length;
        const accepted = files.slice(0, Math.max(room, 0));
        setPhotoError(files.length > accepted.length ? `A place can have up to ${MAX_PHOTOS} photos.` : null);
        if (accepted.length === 0) return;

        setPhotoBusy(true);
        try {
            const prepared: PreparedPhoto[] = [];
            for (const file of accepted) prepared.push(await prepareImage(file));
            setPhotos((current) => [...current, ...prepared].slice(0, MAX_PHOTOS));
        } catch (err) {
            setPhotoError(err instanceof Error ? err.message : 'Could not prepare that photo.');
        } finally {
            setPhotoBusy(false);
        }
    };

    const removePhoto = (id: string) => {
        setPhotos((current) => current.filter((photo) => photo.id !== id));
        setPhotoError(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            const place = await createPlace({
                name,
                description,
                lightCue,
                latitude: location?.latitude,
                longitude: location?.longitude,
                photos: photos.map(({ contentType, dataBase64 }) => ({ contentType, dataBase64 })),
            });
            void navigate(`/places/${encodeURIComponent(place.id)}`);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setSignedOut();
                void navigate(signInPath('/places/new'));
                return;
            }
            setError(
                err instanceof ApiError
                    ? { message: err.message, fields: err.fields ?? {} }
                    : { message: 'Something went wrong. Try again.', fields: {} },
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="space-y-3">
            <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium underline">
                Back to nearby places
            </Link>
            <section className={cardClass} aria-labelledby="new-place-heading">
                <h1 id="new-place-heading" className="text-xl font-bold">
                    Add a place
                </h1>
                <p className="mt-1 text-sm text-stone-700">
                    Share a favorite place. Its location is only used to decide whether it is within a walk.
                </p>

                <form className="mt-4 space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label className={labelClass} htmlFor="place-name">
                            Name
                        </label>
                        <input
                            id="place-name"
                            type="text"
                            className={inputClass}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            aria-invalid={Boolean(fields.name)}
                            aria-describedby={fields.name ? 'place-name-error' : undefined}
                        />
                        <FieldError id="place-name-error" message={fields.name} />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="place-description">
                            Description
                        </label>
                        <textarea
                            id="place-description"
                            rows={4}
                            className={inputClass}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            aria-invalid={Boolean(fields.description)}
                            aria-describedby={fields.description ? 'place-description-error' : undefined}
                        />
                        <FieldError id="place-description-error" message={fields.description} />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="place-cue">
                            Best time of day
                        </label>
                        <select
                            id="place-cue"
                            className={inputClass}
                            value={lightCue}
                            onChange={(event) => setLightCue(event.target.value as LightCue)}
                            aria-invalid={Boolean(fields.lightCue)}
                            aria-describedby={fields.lightCue ? 'place-cue-error' : undefined}
                        >
                            {LIGHT_CUES.map((cue) => (
                                <option key={cue} value={cue}>
                                    {LIGHT_CUE_LABELS[cue]}
                                </option>
                            ))}
                        </select>
                        <FieldError id="place-cue-error" message={fields.lightCue} />
                    </div>

                    <div>
                        <span className={labelClass}>Location</span>
                        <div className="flex items-center gap-3">
                            <button type="button" className={secondaryButtonClass} onClick={captureLocation} disabled={locationPhase === 'locating'}>
                                {location ? 'Update location' : 'Use my current location'}
                            </button>
                            <p role="status" className="text-sm text-stone-700">
                                {locationPhase === 'locating' && 'Finding your location.'}
                                {locationPhase === 'set' && 'Location set.'}
                                {locationPhase === 'failed' && 'Could not get your location. Allow location access and try again.'}
                                {locationPhase === 'idle' && 'No location yet.'}
                            </p>
                        </div>
                        <FieldError id="place-location-error" message={locationError} />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="place-photos">
                            Photos (1 to {MAX_PHOTOS})
                        </label>
                        <input
                            id="place-photos"
                            type="file"
                            accept="image/*"
                            multiple
                            className={inputClass}
                            onChange={(event) => void handlePhotos(event)}
                            disabled={photoBusy || photos.length >= MAX_PHOTOS}
                            aria-invalid={Boolean(photosError)}
                            aria-describedby={photosError ? 'place-photos-error' : undefined}
                        />
                        {photoBusy && (
                            <p role="status" className="mt-1 text-sm text-stone-700">
                                Preparing photos.
                            </p>
                        )}
                        <FieldError id="place-photos-error" message={photosError} />
                        {photos.length > 0 && (
                            <ul className="mt-3 grid grid-cols-2 gap-3">
                                {photos.map((photo, index) => (
                                    <li key={photo.id} className="space-y-1">
                                        <img src={photo.previewUrl} alt={`Selected photo ${index + 1}`} className="aspect-4/3 w-full rounded-lg object-cover" />
                                        <button type="button" className={smallButtonClass} onClick={() => removePhoto(photo.id)}>
                                            Remove photo {index + 1}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {generalError && (
                        <p role="alert" className={errorTextClass}>
                            {generalError}
                        </p>
                    )}

                    <button type="submit" className={`${buttonClass} w-full`} disabled={pending || photoBusy}>
                        {pending ? 'Saving.' : 'Add place'}
                    </button>
                </form>
            </section>
        </div>
    );
};

export default NewPlacePage;
