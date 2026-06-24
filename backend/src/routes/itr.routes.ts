import { Router } from 'express';
import { itrController } from '../controllers/itr.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', itrController.summary);
router.post('/calculate', itrController.calculate);
router.get('/', itrController.list);
router.post('/', itrController.create);
router.get('/:id', itrController.getOne);
router.put('/:id', itrController.update);
router.post('/:id/file', itrController.file);

export default router;
