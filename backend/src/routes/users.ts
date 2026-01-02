import { Router } from 'express';
import { searchUsers, getUser } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/:id', getUser);

export default router;

