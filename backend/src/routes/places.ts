import { Router } from 'express';
import {
    createMomentBodySchema,
    createPlaceBodySchema,
    createRitualBodySchema,
    nearbyQuerySchema,
    putLightBodySchema,
} from 'face2sun-shared';
import { requireMember, validateBody, validateQuery } from '#middlewares';
import {
    checkIn,
    contentTypeForFilename,
    createMoment,
    createPlace,
    createRitual,
    getPublicPlace,
    nearbyPlaces,
    photoPath,
    putLight,
    takeSpot,
} from '#services';
import { fieldsFromZod, httpError } from '#utils';

const router = Router();

function memberId(res: import('express').Response): string {
    return String(res.locals.memberId);
}

router.post('/', requireMember, (req, res, next) => {
    const parsed = createPlaceBodySchema.safeParse(req.body);
    if (!parsed.success) {
        const fields = fieldsFromZod(parsed.error);
        if (fields.latitude || fields.longitude) fields.location = 'A location is required';
        next(httpError(400, 'Invalid request', fields));
        return;
    }
    void createPlace(memberId(res), parsed.data)
        .then((place) => res.status(201).json(place))
        .catch(next);
});

router.get('/nearby', validateQuery(nearbyQuerySchema), async (req, res, next) => {
    try {
        const { lat, lng } = req.query as unknown as { lat: number; lng: number };
        const places = await nearbyPlaces(lat, lng);
        res.status(200).json({ places });
    } catch (err) {
        next(err);
    }
});

router.get('/:placeId', async (req, res, next) => {
    try {
        res.status(200).json(await getPublicPlace(String(req.params.placeId)));
    } catch (err) {
        next(err);
    }
});

router.post('/:placeId/check-ins', requireMember, async (req, res, next) => {
    try {
        const result = await checkIn(memberId(res), String(req.params.placeId));
        res.status(result.status).json({ presenceCount: result.presenceCount });
    } catch (err) {
        next(err);
    }
});

router.post('/:placeId/moments', requireMember, validateBody(createMomentBodySchema), async (req, res, next) => {
    try {
        const moment = await createMoment(memberId(res), String(req.params.placeId), req.body.text);
        res.status(201).json(moment);
    } catch (err) {
        next(err);
    }
});

router.put('/:placeId/light', requireMember, validateBody(putLightBodySchema), async (req, res, next) => {
    try {
        const light = await putLight(memberId(res), String(req.params.placeId), req.body.text);
        res.status(200).json(light);
    } catch (err) {
        next(err);
    }
});

router.post('/:placeId/ritual', requireMember, validateBody(createRitualBodySchema), async (req, res, next) => {
    try {
        const ritual = await createRitual(memberId(res), String(req.params.placeId), req.body);
        res.status(201).json(ritual);
    } catch (err) {
        next(err);
    }
});

router.post('/:placeId/ritual/spots', requireMember, async (req, res, next) => {
    try {
        const result = await takeSpot(memberId(res), String(req.params.placeId));
        res.status(result.status).json({ spotsTaken: result.spotsTaken, cap: result.cap });
    } catch (err) {
        next(err);
    }
});

export default router;

export function sendPhoto(filename: string, res: import('express').Response, next: import('express').NextFunction): void {
    const file = photoPath(filename);
    const contentType = contentTypeForFilename(filename);
    if (!file || !contentType) {
        next(httpError(404, 'Photo not found'));
        return;
    }
    res.type(contentType).sendFile(file);
}
