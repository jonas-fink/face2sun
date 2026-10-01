import type { PublicPlaceCard } from 'face2sun-shared';

const MapStrip = ({ places }: { places: PublicPlaceCard[] }) => {
    if (places.length === 0) return null;

    return (
        <div
            role="img"
            aria-label={`${places.length} ${places.length === 1 ? 'place' : 'places'} within a walk, nearest first`}
            className="relative flex h-14 items-center justify-around rounded-xl border border-stone-300 bg-amber-100 px-4"
        >
            <div aria-hidden="true" className="absolute inset-x-6 top-1/2 h-px bg-stone-400" />
            {places.map((place, index) => (
                <span
                    key={place.id}
                    aria-hidden="true"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-stone-900 ring-2 ring-white"
                >
                    {index + 1}
                </span>
            ))}
        </div>
    );
};

export default MapStrip;
