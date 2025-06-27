"use strict";
// routes/userRoutes.ts - Defines API routes for Users
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// --- User Routes ---
/**
 * @route GET /
 * @description Get all users, optionally filtered by role (e.g., /users?role=teacher)
 * Corresponds to http://localhost:5002/users
 */
router.get('/', userController_1.getAllUsers);
/**
 * @route GET /:id
 * @description Get a user by their ID
 * Corresponds to http://localhost:5002/users/:id
 */
router.get('/:id', userController_1.getUserById);
/**
 * @route POST /
 * @description Create a new user (and assign subjects if role is teacher)
 * Corresponds to http://localhost:5002/users
 */
router.post('/', userController_1.createUser);
/**
 * @route PUT /:id
 * @description Update an existing user (and update subject assignments if role is teacher)
 * Corresponds to http://localhost:5002/users/:id
 */
router.put('/:id', userController_1.updateUser);
/**
 * @route DELETE /:id
 * @description Soft deletes a user by their ID
 * Corresponds to http://localhost:5002/users/:id
 */
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
