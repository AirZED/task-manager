import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} from '../controllers/boardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.get('/:id', getBoard);
router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Title is required')],
  createBoard
);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);

export default router;

