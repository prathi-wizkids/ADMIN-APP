// controllers/teacherDirectController.ts - Final TypeScript Fix

import { Request, Response, RequestHandler } from 'express';
import {
  createTeacherDirect,
  updateTeacherDirect,
  findTeacherDirectById,
  findAllTeachersDirect
} from '../services/teacherDirectServices';

/**
 * Get all teachers directly from teachmate.teachers.
 * @param req Request object
 * @param res Response object
 */
export const getAllTeachersDirect: RequestHandler = async (req, res) => {
  try {
    const teachers = await findAllTeachersDirect();
    res.status(200).json(teachers); // Final success response, no 'return'
  } catch (error: any) {
    console.error('Error in getAllTeachersDirect:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Get a single teacher directly by teachid.
 * @param req Request object (expects teachid in params)
 * @param res Response object
 */
export const getTeacherDirectById: RequestHandler = async (req, res) => {
  const teachid = parseInt(req.params.teachid);
  if (isNaN(teachid)) {
    res.status(400).json({ message: 'Invalid Teacher ID' });
    return; // Early exit, explicit 'return'
  }
  try {
    const teacher = await findTeacherDirectById(teachid);
    if (teacher) {
      res.status(200).json(teacher); // Final success response, no 'return'
    } else {
      res.status(404).json({ message: 'Teacher not found' }); // Early exit, no 'return' (as it's inside an if/else, the function naturally ends)
    }
  } catch (error: any) {
    console.error(`Error in getTeacherDirectById (Teacher ID: ${teachid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Create a new teacher directly in teachmate.teachers.
 * @param req Request object (expects name, email, subjectIds)
 * @param res Response object
 */
export const createTeacherDirectController: RequestHandler = async (req, res) => {
  const { name, email, subjectIds } = req.body;

  if (!name || typeof name !== 'string' || !email || typeof email !== 'string') {
    res.status(400).json({ message: 'Name (string) and Email (string) are required' });
    return; // Early exit, explicit 'return'
  }
  if (subjectIds !== undefined && (!Array.isArray(subjectIds) || !subjectIds.every(id => typeof id === 'number'))) {
    res.status(400).json({ message: 'Subject IDs must be an array of numbers if provided' });
    return; // Early exit, explicit 'return'
  }

  try {
    const newTeacher = await createTeacherDirect(name, email, subjectIds);
    if (newTeacher === false) {
      res.status(409).json({ message: `Teacher with email '${email}' already exists.` });
      return; // Early exit, explicit 'return'
    }
    res.status(201).json(newTeacher); // Final success response, no 'return'
  } catch (error: any) {
    console.error('Error in createTeacherDirectController:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};

/**
 * Update an existing teacher directly in teachmate.teachers.
 * @param req Request object (expects teachid in params, optional name, email, subjectIds in body)
 * @param res Response object
 */
export const updateTeacherDirectController: RequestHandler = async (req, res) => {
  const teachid = parseInt(req.params.teachid);
  const { name, email, subjectIds } = req.body;

  if (isNaN(teachid)) {
    res.status(400).json({ message: 'Invalid Teacher ID' });
    return; // Early exit, explicit 'return'
  }

  const hasUpdates = (name !== undefined || email !== undefined || subjectIds !== undefined);
  if (!hasUpdates) {
    res.status(400).json({ message: 'At least one field (name, email, or subjectIds) must be provided for update' });
    return; // Early exit, explicit 'return'
  }

  if (name !== undefined && typeof name !== 'string') {
    res.status(400).json({ message: 'Name must be a string' });
    return; // Early exit, explicit 'return'
  }
  if (email !== undefined && typeof email !== 'string') {
    res.status(400).json({ message: 'Email must be a string' });
    return; // Early exit, explicit 'return'
  }
  if (subjectIds !== undefined && (!Array.isArray(subjectIds) || !subjectIds.every(id => typeof id === 'number'))) {
    res.status(400).json({ message: 'Subject IDs must be an array of numbers' });
    return; // Early exit, explicit 'return'
  }

  try {
    const updatedTeacher = await updateTeacherDirect(teachid, { name, email, subjectIds });
    if (updatedTeacher === '404') {
      res.status(404).json({ message: 'Teacher not found.' });
      return; // Early exit, explicit 'return'
    }
    if (updatedTeacher === false) {
      res.status(409).json({ message: `Teacher with email '${email}' already exists.` });
      return; // Early exit, explicit 'return'
    }
    res.status(200).json(updatedTeacher); // Final success response, no 'return'
  } catch (error: any) {
    console.error(`Error in updateTeacherDirectController (Teacher ID: ${teachid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message }); // Error response, no 'return'
  }
};
