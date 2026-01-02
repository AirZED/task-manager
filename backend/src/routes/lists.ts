import { Router } from 'express';
import { body } from 'express-validator';
import {
  createList,
  updateList,
  deleteList,
  reorderLists,
} from '../controllers/listController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
  ],
  createList
);
router.put('/:id', updateList);
router.delete('/:id', deleteList);
router.post('/reorder', reorderLists);

export default router;

