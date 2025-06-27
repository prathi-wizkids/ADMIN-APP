// routes/userRoutes.ts - Defines API routes for Users

import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';

const router = Router();

// --- User Routes ---

/**
 * @route GET /
 * @description Get all users, optionally filtered by role (e.g., /users?role=teacher)
 * Corresponds to http://localhost:5002/users
 */
router.get('/', getAllUsers);

/**
 * @route GET /:id
 * @description Get a user by their ID
 * Corresponds to http://localhost:5002/users/:id
 */
router.get('/:id', getUserById);

/**
 * @route POST /
 * @description Create a new user (and assign subjects if role is teacher)
 * Corresponds to http://localhost:5002/users
 */
router.post('/', createUser);

/**
 * @route PUT /:id
 * @description Update an existing user (and update subject assignments if role is teacher)
 * Corresponds to http://localhost:5002/users/:id
 */
router.put('/:id', updateUser);

/**
 * @route DELETE /:id
 * @description Soft deletes a user by their ID
 * Corresponds to http://localhost:5002/users/:id
 */
router.delete('/:id', deleteUser);

export default router;

