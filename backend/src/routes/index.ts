import { Router } from 'express';
import { healthSchema } from 'face2sun-shared';

const router = Router();

router.get('/health', (_req, res) => {
    res.json(healthSchema.parse({ status: 'ok' }));
});

export default router;
