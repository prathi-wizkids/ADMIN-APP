// routes/teacherDirectRoutes.ts - Defines direct teacher management routes

import { Router } from 'express';
import {
  getAllTeachersDirect,
  getTeacherDirectById,
  createTeacherDirectController,
  updateTeacherDirectController
} from '../controllers/teacherDirectController';

const router = Router();

// GET all teachers directly
router.get('/', getAllTeachersDirect);

// GET a single teacher directly by ID
router.get('/:teachid', getTeacherDirectById);

// POST create a new teacher directly
router.post('/', createTeacherDirectController);

// PUT update an existing teacher directly by ID
router.put('/:teachid', updateTeacherDirectController);

export default router;
