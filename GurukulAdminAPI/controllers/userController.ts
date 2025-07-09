// controllers/userController.ts - Handles the logic for User and Teacher-Subject Assignment CRUD operations.
// Updated: Supports passing password_hash for user creation.

import { Request, Response, RequestHandler } from 'express';
import {
  findAllUsers,
  findUserById,
  createNewUser,
  updateExistingUser,
  softDeleteUserById,
  //assignSubjectsToTeacher,
  // findSubjectsAssignedToTeacher // Not directly used in controller, but in service
} from '../services/userservice';

// --- User Controller Functions ---

/**
 * Get all users, optionally filtered by role.
 * @param req Request object (expects optional 'role' query param)
 * @param res Response object
 */
export const getAllUsers: RequestHandler = async (req, res) => {
  const role = req.query.role as string | undefined; // Get role from query parameter
  try {
    const users = await findAllUsers(role);
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

/**
 * Get a single user by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const getUserById: RequestHandler = async (req, res) => {
  const userid = parseInt(req.params.id);
  if (isNaN(userid)) {
    res.status(400).json({ message: 'Invalid User ID' });
    return;
  }

  try {
    const user = await findUserById(userid);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    console.error(`Error in getUserById (User ID: ${userid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

/**
 * Create a new user.
 * @param req Request object (expects username, email, role, [subject_ids for teachers])
 * @param res Response object
 */
/**
 * Create a new user.
 * The service layer will handle the creation in public.users and role-specific tables,
 * and the assignments (subjects for teachers, gurukuls/milestones for students).
 * @param req Request object (expects username, email, role, [subject_ids for teachers], [gurukul_id, milestone_id for students])
 * @param res Response object
 */
export const createUser: RequestHandler = async (req, res) => {
  const { username, email, role, subject_ids, gurukul_id, milestone_id } = req.body;

  if (!username || typeof username !== 'string' || !email || typeof email !== 'string' || !role || typeof role !== 'string') {
    res.status(400).json({ message: 'Username (string), Email (string), and Role (string) are required' });
    return;
  }
  if (role === 'teacher') {
    if (subject_ids !== undefined && (!Array.isArray(subject_ids) || !subject_ids.every(id => typeof id === 'number'))) {
      res.status(400).json({ message: 'For a teacher, subject_ids must be an array of numbers if provided' });
      return;
    }
  } else if (role === 'student') {
    if (gurukul_id !== undefined && (typeof gurukul_id !== 'number' && gurukul_id !== null)) {
      res.status(400).json({ message: 'If provided, gurukul_id must be a number or null' });
      return;
    }
    if (milestone_id !== undefined && (typeof milestone_id !== 'number' && milestone_id !== null)) {
      res.status(400).json({ message: 'If provided, milestone_id must be a number or null' });
      return;
    }
  }

  try {
    // This call passes all relevant data to createNewUser.
    // createNewUser (in userService.ts) is now responsible for calling
    // assignSubjectsToTeacher internally with the correct client.
    const newUser = await createNewUser(username, email, role, gurukul_id, milestone_id, subject_ids);

    if (newUser === false) {
      res.status(409).json({ message: `User with email '${email}' already exists.` });
      return;
    }
    if (!newUser) {
        res.status(500).json({ message: 'Failed to create user due to unknown error.' });
        return;
    }

    // REMOVED: No longer call assignSubjectsToTeacher directly here.
    // The previous problematic line:
    // if (role === 'teacher' && subject_ids && Array.isArray(subject_ids)) {
    //     const assigned = await assignSubjectsToTeacher(newUser.userid, subject_ids);
    // }

    // The service now returns the fully enhanced user object
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

/**
 * Update an existing user.
 * The service layer will handle the propagation of updates and assignments.
 * @param req Request object (expects id in params, optional username, email, role, subject_ids, gurukul_id, milestone_id in body)
 * @param res Response object
 */
export const updateUser: RequestHandler = async (req, res) => {
  const userid = parseInt(req.params.id);
  const { username, email, role, subject_ids, gurukul_id, milestone_id } = req.body;
  console.log("In update User controller");
  if (isNaN(userid)) {
    res.status(400).json({ message: 'Invalid User ID' });
    return;
  }

  const hasUpdates = (username !== undefined || email !== undefined || role !== undefined || subject_ids !== undefined || gurukul_id !== undefined || milestone_id !== undefined);
  if (!hasUpdates) {
    res.status(400).json({ message: 'At least one field (username, email, role, subject_ids, gurukul_id, or milestone_id) must be provided for update' });
    return;
  }

  if (username !== undefined && typeof username !== 'string') {
    res.status(400).json({ message: 'Username must be a string' });
    return;
  }
  if (email !== undefined && typeof email !== 'string') {
    res.status(400).json({ message: 'Email must be a string' });
    return;
  }
  if (role !== undefined && typeof role !== 'string') {
    res.status(400).json({ message: 'Role must be a string' });
    return;
  }
  if (subject_ids !== undefined && (!Array.isArray(subject_ids) || !subject_ids.every(id => typeof id === 'number'))) {
    res.status(400).json({ message: 'Subject IDs must be an array of numbers' });
    return;
  }
  if (gurukul_id !== undefined && (typeof gurukul_id !== 'number' && gurukul_id !== null)) {
    res.status(400).json({ message: 'If provided, gurukul_id must be a number or null' });
    return;
  }
  if (milestone_id !== undefined && (typeof milestone_id !== 'number' && milestone_id !== null)) {
    res.status(400).json({ message: 'If provided, milestone_id must be a number or null' });
    return;
  }

  try {
    // This call passes all relevant data to updateExistingUser.
    // updateExistingUser (in userService.ts) is now responsible for calling
    // assignSubjectsToTeacher, assignGurukulToStudent, etc., internally.
    const updatedUser = await updateExistingUser(userid, { username, email, role, subject_ids, gurukulId: gurukul_id, milestoneId: milestone_id });

    if (updatedUser === '404') {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    if (updatedUser === false) {
      res.status(409).json({ message: `User with email '${email}' already exists.` });
      return;
    }
    
    // The service now returns the fully enhanced user object
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error(`Error in updateUser (User ID: ${userid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

/**
 * Soft deletes a user (sets isdeleted to TRUE) in public.users and deletes from role-specific tables.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const deleteUser: RequestHandler = async (req, res) => {
  const userid = parseInt(req.params.id);
  if (isNaN(userid)) {
    res.status(400).json({ message: 'Invalid User ID' });
    return;
  }

  try {
    const deleted = await softDeleteUserById(userid);
    if (!deleted) {
      res.status(404).json({ message: 'User not found or already deleted' });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error in deleteUser (User ID: ${userid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};
