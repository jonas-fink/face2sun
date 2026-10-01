import type { PublicLight, PublicMoment, PublicPlace, PublicPlaceCard, PublicRitual } from 'face2sun-shared';

type PhotoDoc = { filename: string };
type PlaceDoc = {
    id: string;
    name: string;
    description: string;
    lightCue: PublicPlace['lightCue'];
    photos: PhotoDoc[];
};
type MomentDoc = { id: string; text: string; createdAt: Date };
type LightDoc = { text: string; createdAt: Date };
type RitualDoc = { title: string; recurrence: string; cap: number };

export function toPublicMoment(doc: MomentDoc): PublicMoment {
    return { id: doc.id, text: doc.text, at: doc.createdAt.toISOString() };
}

export function toPublicLight(doc: LightDoc): PublicLight {
    return { text: doc.text, at: doc.createdAt.toISOString() };
}

export function toPublicRitual(doc: RitualDoc, spotsTaken: number): PublicRitual {
    return { title: doc.title, recurrence: doc.recurrence, spotsTaken, cap: doc.cap };
}

export function toPublicPlace(
    place: PlaceDoc,
    extras: {
        presenceCount: number;
        moments: MomentDoc[];
        light: LightDoc | null;
        ritual: { doc: RitualDoc; spotsTaken: number } | null;
    },
): PublicPlace {
    return {
        id: place.id,
        name: place.name,
        description: place.description,
        lightCue: place.lightCue,
        photos: place.photos.map((photo) => ({ url: `/api/media/${photo.filename}` })),
        presenceCount: extras.presenceCount,
        moments: extras.moments.map(toPublicMoment),
        light: extras.light ? toPublicLight(extras.light) : null,
        ritual: extras.ritual ? toPublicRitual(extras.ritual.doc, extras.ritual.spotsTaken) : null,
    };
}

export function toPublicCard(
    place: { id: string; name: string; lightCue: PublicPlace['lightCue'] },
    presenceCount: number,
    ritual: { doc: RitualDoc; spotsTaken: number } | null,
): PublicPlaceCard {
    return {
        id: place.id,
        name: place.name,
        lightCue: place.lightCue,
        presenceCount,
        ritual: ritual ? toPublicRitual(ritual.doc, ritual.spotsTaken) : null,
    };
}
