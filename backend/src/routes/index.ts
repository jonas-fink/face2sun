import { Router } from 'express';
import { healthSchema } from 'face2sun-shared';
import authRoutes from './auth.ts';
import placeRoutes, { sendPhoto } from './places.ts';

const router = Router();

router.get('/health', (_req, res) => {
    res.json(healthSchema.parse({ status: 'ok' }));
});

router.use('/auth', authRoutes);
router.use('/places', placeRoutes);
router.get('/media/:filename', (req, res, next) => {
    sendPhoto(String(req.params.filename), res, next);
});

export default router;
