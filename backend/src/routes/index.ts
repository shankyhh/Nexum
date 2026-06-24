import { Router } from 'express';
import authRoutes from './auth.routes';
import gstRoutes from './gst.routes';
import itrRoutes from './itr.routes';
import vaultiqRoutes from './vaultiq.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/gst', gstRoutes);
router.use('/itr', itrRoutes);
router.use('/vaultiq', vaultiqRoutes);
router.use('/ai', aiRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'NEXUM API is running.', timestamp: new Date().toISOString() });
});

export default router;
