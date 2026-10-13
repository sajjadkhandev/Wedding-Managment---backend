import express from 'express';
import {
  getMyProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addEventToProject,
  updateEvent,
  deleteEvent
} from '../controllers/weddingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Enforce authentication & Customer/Admin authorization
router.use(protect);
router.use(authorize(ROLES.CUSTOMER, ROLES.ADMIN));

router.get('/', getMyProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Event sub-routes
router.post('/:id/events', addEventToProject);
router.put('/events/:eventId', updateEvent);
router.delete('/events/:eventId', deleteEvent);

export default router;
