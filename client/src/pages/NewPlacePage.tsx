import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { LightCue } from 'face2sun-shared';
import { ApiError, createPlace } from '../api/face2sun';
import { CueIcon } from '../components/brand';
import { CUE_BG, buttonClass, displayClass, errorTextClass, eyebrowClass, inputClass, labelClass, secondaryButtonClass, smallButtonClass } from '../components/ui';
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
            <Link to="/" className={`${smallButtonClass} bg-paper`}>
                Back to nearby places
            </Link>
            <section aria-labelledby="new-place-heading" className="pt-4">
                <p className={eyebrowClass}>Share a place</p>
                <h1 id="new-place-heading" className={`${displayClass} mt-2 text-4xl leading-none`}>
                    Add a place
                </h1>
                <p className="mt-3 text-bark">Where does the sun find you? Its location is only used to decide whether it is within a walk.</p>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
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

                    <fieldset aria-describedby={fields.lightCue ? 'place-cue-error' : undefined}>
                        <legend className={labelClass}>When is the light best?</legend>
                        <div className="grid grid-cols-2 gap-2.5">
                            {LIGHT_CUES.map((cue) => (
                                <label
                                    key={cue}
                                    className={`flex min-h-14 cursor-pointer items-center gap-2.5 rounded-2xl px-3.5 font-semibold transition has-checked:ring-[2.5px] has-checked:ring-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dusk ${CUE_BG[cue]}`}
                                >
                                    <input
                                        type="radio"
                                        name="lightCue"
                                        value={cue}
                                        checked={lightCue === cue}
                                        onChange={() => setLightCue(cue)}
                                        className="sr-only"
                                    />
                                    <CueIcon cue={cue} size={20} />
                                    {LIGHT_CUE_LABELS[cue]}
                                </label>
                            ))}
                        </div>
                        <FieldError id="place-cue-error" message={fields.lightCue} />
                    </fieldset>

                    <div>
                        <span className={labelClass}>Location</span>
                        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-cue-morning p-3">
                            <button type="button" className={secondaryButtonClass} onClick={captureLocation} disabled={locationPhase === 'locating'}>
                                {location ? 'Update location' : 'Use my current location'}
                            </button>
                            <p role="status" className="flex items-center gap-2 text-sm font-semibold text-ink">
                                {locationPhase === 'set' && <span aria-hidden="true" className="size-3 rounded-full bg-ember motion-safe:animate-glow" />}
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
                            className="block w-full cursor-pointer rounded-3xl border-2 border-dashed border-bark bg-card p-4 text-sm text-bark file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-sun file:px-5 file:font-bold file:text-sunink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk disabled:cursor-not-allowed disabled:opacity-60"
                            onChange={(event) => void handlePhotos(event)}
                            disabled={photoBusy || photos.length >= MAX_PHOTOS}
                            aria-invalid={Boolean(photosError)}
                            aria-describedby={photosError ? 'place-photos-error' : undefined}
                        />
                        {photoBusy && (
                            <p role="status" className="mt-1 text-sm text-bark">
                                Preparing photos.
                            </p>
                        )}
                        <FieldError id="place-photos-error" message={photosError} />
                        {photos.length > 0 && (
                            <ul className="mt-3 grid grid-cols-2 gap-3">
                                {photos.map((photo, index) => (
                                    <li key={photo.id} className="space-y-1">
                                        <img src={photo.previewUrl} alt={`Selected photo ${index + 1}`} className="aspect-square w-full rounded-3xl object-cover" />
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
