import { Router } from 'express';
import { body } from 'express-validator';
import {
  createCard,
  getCard,
  updateCard,
  deleteCard,
  moveCard,
  getTasksByStatus,
} from '../controllers/cardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
  ],
  createCard
);
router.get('/board/:boardId/status/:status', getTasksByStatus);
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);
router.post('/move', moveCard);

export default router;

