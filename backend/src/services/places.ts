import type { PublicPlace, PublicPlaceCard } from 'face2sun-shared';
import { CheckIn, Light, Moment, Place, Ritual, RitualSpot } from '#models';
import { WALK_RADIUS_METERS } from '#domain';
import { httpError, isDuplicateKey } from '#utils';
import { deletePhoto, savePhoto } from './photos.ts';
import { toPublicCard, toPublicPlace } from './public.ts';

const EMPTY = { presenceCount: 0, moments: [], light: null, ritual: null };

type PhotoInput = { contentType: string; dataBase64: string };

export async function presenceCount(placeId: string, now = new Date()): Promise<number> {
    return CheckIn.countDocuments({ placeId, expiresAt: { $gt: now } });
}

async function ritualSummary(placeId: string) {
    const ritual = await Ritual.findOne({ placeId });
    if (!ritual) return null;
    const spotsTaken = await RitualSpot.countDocuments({ ritualId: ritual._id });
    return { doc: ritual, spotsTaken };
}

export async function getPublicPlace(placeId: string): Promise<PublicPlace> {
    const place = await Place.findById(placeId);
    if (!place) throw httpError(404, 'Place not found');
    const [count, moments, light, ritual] = await Promise.all([
        presenceCount(place.id),
        Moment.find({ placeId: place._id }).sort({ createdAt: -1 }).limit(50),
        Light.findOne({ placeId: place._id }),
        ritualSummary(place.id),
    ]);
    return toPublicPlace(place, { presenceCount: count, moments, light, ritual });
}

export async function createPlace(
    memberId: string,
    input: {
        name: string;
        description: string;
        lightCue: PublicPlace['lightCue'];
        latitude: number;
        longitude: number;
        photos: PhotoInput[];
    },
): Promise<PublicPlace> {
    const written: { filename: string; contentType: string }[] = [];
    try {
        for (const photo of input.photos) {
            written.push(savePhoto(photo.contentType, photo.dataBase64));
        }
        const place = await Place.create({
            name: input.name,
            description: input.description,
            lightCue: input.lightCue,
            location: { type: 'Point', coordinates: [input.longitude, input.latitude] },
            photos: written,
            createdBy: memberId,
        });
        return toPublicPlace(place, EMPTY);
    } catch (err) {
        for (const photo of written) deletePhoto(photo.filename);
        if (isDuplicateKey(err)) throw httpError(409, 'Could not save that place');
        throw err;
    }
}

export async function nearbyPlaces(lat: number, lng: number): Promise<PublicPlaceCard[]> {
    const places = await Place.find({
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: WALK_RADIUS_METERS,
            },
        },
    }).limit(3);
    const cards: PublicPlaceCard[] = [];
    for (const place of places) {
        const [count, ritual] = await Promise.all([presenceCount(place.id), ritualSummary(place.id)]);
        cards.push(toPublicCard(place, count, ritual));
    }
    return cards;
}

export async function createMoment(memberId: string, placeId: string, text: string) {
    const place = await Place.findById(placeId);
    if (!place) throw httpError(404, 'Place not found');
    const moment = await Moment.create({ placeId, memberId, text });
    return { id: moment.id, text: moment.text, at: moment.createdAt.toISOString() };
}

export async function putLight(memberId: string, placeId: string, text: string) {
    const place = await Place.findById(placeId);
    if (!place) throw httpError(404, 'Place not found');
    const light = await Light.findOneAndUpdate(
        { placeId },
        { memberId, text, createdAt: new Date() },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    return { text: light.text, at: light.createdAt.toISOString() };
}
