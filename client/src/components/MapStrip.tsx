import type { PublicPlaceCard } from 'face2sun-shared';

const MapStrip = ({ places }: { places: PublicPlaceCard[] }) => {
    if (places.length === 0) return null;

    return (
        <div
            role="img"
            aria-label={`${places.length} ${places.length === 1 ? 'place' : 'places'} within a walk, nearest first`}
            className="relative flex h-14 items-center justify-around rounded-full bg-cue-morning px-4"
        >
            <div aria-hidden="true" className="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-bark/40" />
            <span aria-hidden="true" className="relative size-3 rounded-full border-2 border-ink bg-paper" title="You" />
            {places.map((place, index) => (
                <span
                    key={place.id}
                    aria-hidden="true"
                    className="relative flex size-9 items-center justify-center rounded-full bg-sun font-display text-sm font-extrabold text-sunink ring-4 ring-cue-morning"
                >
                    {index + 1}
                </span>
            ))}
        </div>
    );
};

export default MapStrip;
