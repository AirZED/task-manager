import { Router } from 'express';
import { body } from 'express-validator';
import {
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('text').trim().notEmpty().withMessage('Comment text is required'),
    body('cardId').notEmpty().withMessage('Card ID is required'),
  ],
  createComment
);
router.put(
  '/:id',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  updateComment
);
router.delete('/:id', deleteComment);

export default router;

