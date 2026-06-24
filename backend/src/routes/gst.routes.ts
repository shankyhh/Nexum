import { Router } from 'express';
import { gstController } from '../controllers/gst.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', gstController.summary);
router.post('/calculate', gstController.calculate);
router.get('/', gstController.list);
router.post('/', gstController.create);
router.get('/:id', gstController.getOne);
router.put('/:id', gstController.update);
router.post('/:id/file', gstController.file);

export default router;
