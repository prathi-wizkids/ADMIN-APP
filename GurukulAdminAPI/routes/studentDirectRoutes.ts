// routes/studentDirectRoutes.ts - Defines direct student management routes

import { Router } from 'express';
import {
  getAllStudentsDirect,
  getStudentDirectById,
  createStudentDirectController,
  updateStudentDirectController
} from '../controllers/studentDirectController';

const router = Router();

// GET all students directly
router.get('/', getAllStudentsDirect);

// GET a single student directly by ID
router.get('/:sid', getStudentDirectById);

// POST create a new student directly
router.post('/', createStudentDirectController);

// PUT update an existing student directly by ID
router.put('/:sid', updateStudentDirectController);

export default router;
