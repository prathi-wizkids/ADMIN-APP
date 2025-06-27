// routes/subjectRoutes.ts - Defines API routes for Subjects

import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController';

const router = Router();

// --- Subject Routes ---

/**
 * @route GET /
 * @description Get all subjects
 * Corresponds to http://localhost:5002/subjects when mounted at '/subjects'
 */
router.get('/', getAllSubjects);

/**
 * @route GET /:id
 * @description Get a subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.get('/:id', getSubjectById);

/**
 * @route POST /
 * @description Create a new subject
 * Corresponds to http://localhost:5002/subjects
 */
router.post('/', createSubject);

/**
 * @route PUT /:id
 * @description Update an existing subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.put('/:id', updateSubject);

/**
 * @route DELETE /:id
 * @description Delete a subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.delete('/:id', deleteSubject);

export default router;

