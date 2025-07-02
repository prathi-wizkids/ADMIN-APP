// controllers/studentDirectController.ts - Final TypeScript Fix

import { Request, Response, RequestHandler } from 'express';
import {
  createStudentDirect,
  updateStudentDirect,
  findStudentDirectById,
  findAllStudentsDirect
} from '../services/studentDirectService';

/**
 * Get all students directly from studentmate.students.
 * @param req Request object
 * @param res Response object
 */
export const getAllStudentsDirect: RequestHandler = async (req, res) => {
  try {
    const students = await findAllStudentsDirect();
    res.status(200).json(students); // Final success response, no 'return'
  } catch (error: any) {
    console.error('Error in getAllStudentsDirect:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Get a single student directly by sid.
 * @param req Request object (expects sid in params)
 * @param res Response object
 */
export const getStudentDirectById: RequestHandler = async (req, res) => {
  const sid = parseInt(req.params.sid);
  if (isNaN(sid)) {
    res.status(400).json({ message: 'Invalid Student ID' });
    return; // Early exit, explicit 'return'
  }
  try {
    const student = await findStudentDirectById(sid);
    if (student) {
      res.status(200).json(student); // Final success response, no 'return'
    } else {
      res.status(404).json({ message: 'Student not found' }); // Early exit, no 'return' (as it's inside an if/else, the function naturally ends)
    }
  } catch (error: any) {
    console.error(`Error in getStudentDirectById (Student ID: ${sid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Create a new student directly in studentmate.students.
 * @param req Request object (expects sname, email, gurukulId, milestoneId)
 * @param res Response object
 */
export const createStudentDirectController: RequestHandler = async (req, res) => {
  const { sname, email, gurukulId, milestoneId } = req.body;

  if (!sname || typeof sname !== 'string' || !email || typeof email !== 'string') {
    res.status(400).json({ message: 'Name (string) and Email (string) are required' });
    return; // Early exit, explicit 'return'
  }
  if (gurukulId !== undefined && (typeof gurukulId !== 'number' && gurukulId !== null)) {
    res.status(400).json({ message: 'If provided, gurukulId must be a number or null' });
    return; // Early exit, explicit 'return'
  }
  if (milestoneId !== undefined && (typeof milestoneId !== 'number' && milestoneId !== null)) {
    res.status(400).json({ message: 'If provided, milestoneId must be a number or null' });
    return; // Early exit, explicit 'return'
  }

  try {
    const newStudent = await createStudentDirect(sname, email, gurukulId, milestoneId);
    if (newStudent === false) {
      res.status(409).json({ message: `Student with email '${email}' already exists.` });
      return; // Early exit, explicit 'return'
    }
    res.status(201).json(newStudent); // Final success response, no 'return'
  } catch (error: any) {
    console.error('Error in createStudentDirectController:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Update an existing student directly in studentmate.students.
 * @param sid The ID of the student to update.
 * @param studentData Object containing optional sname, email, gurukulId, and milestoneId in body)
 * @param res Response object
 */
export const updateStudentDirectController: RequestHandler = async (req, res) => {
  const sid = parseInt(req.params.sid);
  const { sname, email, gurukulId, milestoneId } = req.body;

  if (isNaN(sid)) {
    res.status(400).json({ message: 'Invalid Student ID' });
    return; // Early exit, explicit 'return'
  }

  const hasUpdates = (sname !== undefined || email !== undefined || gurukulId !== undefined || milestoneId !== undefined);
  if (!hasUpdates) {
    res.status(400).json({ message: 'At least one field (name, email, gurukulId, or milestoneId) must be provided for update' });
    return; // Early exit, explicit 'return'
  }

  if (sname !== undefined && typeof sname !== 'string') {
    res.status(400).json({ message: 'Name must be a string' });
    return; // Early exit, explicit 'return'
  }
  if (email !== undefined && typeof email !== 'string') {
    res.status(400).json({ message: 'Email must be a string' });
    return; // Early exit, explicit 'return'
  }
  if (gurukulId !== undefined && (typeof gurukulId !== 'number' && gurukulId !== null)) {
    res.status(400).json({ message: 'If provided, gurukulId must be a number or null' });
    return; // Early exit, explicit 'return'
  }
  if (milestoneId !== undefined && (typeof milestoneId !== 'number' && milestoneId !== null)) {
    res.status(400).json({ message: 'If provided, milestoneId must be a number or null' });
    return; // Early exit, explicit 'return'
  }

  try {
    const updatedStudent = await updateStudentDirect(sid, { sname, email, gurukulId, milestoneId });
    if (updatedStudent === '404') {
      res.status(404).json({ message: 'Student not found.' });
      return; // Early exit, explicit 'return'
    }
    if (updatedStudent === false) {
      res.status(409).json({ message: `Student with email '${email}' already exists.` });
      return; // Early exit, explicit 'return'
    }
    res.status(200).json(updatedStudent); // Final success response, no 'return'
  } catch (error: any) {
    console.error(`Error in updateStudentDirectController (Student ID: ${sid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};
