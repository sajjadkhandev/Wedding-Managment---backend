import express from 'express';
import {
  getGuests,
  createGuest,
  updateRSVP,
  deleteGuest,
  getExpenses,
  createExpense,
  deleteExpense,
  getTasks,
  createTask,
  toggleTask,
  deleteTask
} from '../controllers/planningController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All planning routes require authentication
router.use(protect);

// Guests
router.route('/projects/:projectId/guests')
  .get(getGuests)
  .post(createGuest);

router.patch('/guests/:id/rsvp', updateRSVP);
router.delete('/guests/:id', deleteGuest);

// Expenses & Budget
router.route('/projects/:projectId/expenses')
  .get(getExpenses)
  .post(createExpense);

router.delete('/expenses/:id', deleteExpense);

// Tasks & Checklist
router.route('/projects/:projectId/tasks')
  .get(getTasks)
  .post(createTask);

router.patch('/tasks/:id/toggle', toggleTask);
router.delete('/tasks/:id', deleteTask);

export default router;
