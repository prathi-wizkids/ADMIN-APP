// controllers/milestoneController.ts - Handles the logic for Milestone CRUD operations
// Uses milestoneService for business logic and handles async operations.

import { Request, Response, RequestHandler } from 'express';
import {
  findAllMilestones,
  findMilestoneById,
  createNewMilestone,
  updateExistingMilestone,
  deleteMilestoneById,
  findAllMilestonesbyGid,
  findDistinctMilestoneLevels,

} from '../services/milestoneService'; // Import milestone service functions

// --- Milestone Controller Functions ---

/**
 * Get all milestones.
 * @param req Request object
 * @param res Response object
 */
export const getAllMilestones: RequestHandler = async (req, res) => {
  try {
    const milestones = await findAllMilestones();
    res.status(200).json(milestones);
  } catch (error: any) {
    console.error('Error in getAllMilestones:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};
export const getMilestonesByGurukul: (req: Request, res: Response) => Promise<void> = async (req, res) => {
  const gid = parseInt(req.params.gid);
  console.log("I AM HERE IN getMilestonesByGurukul Controller");
  if (isNaN(gid)) {
    res.status(400).json({ message: 'Invalid Gurukul ID' });
    return;
  }
  try {
    const milestones = await findAllMilestonesbyGid(gid);
    res.status(200).json(milestones);
  } catch (error: any) {
    console.error(`Error in getMilestonesByGurukul (GID: ${gid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};
/**
 * Get a single milestone by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const getMilestoneById: RequestHandler = async (req, res) => {
  const mid = parseInt(req.params.id);
  if (isNaN(mid)) {
    res.status(400).json({ message: 'Invalid Milestone ID' });
    return;
  }

  try {
    const milestone = await findMilestoneById(mid);
    if (!milestone) {
      res.status(404).json({ message: 'Milestone not found' });
      return;
    }
    res.status(200).json(milestone);
  } catch (error: any) {
    console.error(`Error in getMilestoneById (MID: ${mid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};
/**
 * Get all distinct levels from the milestones table.
 * @param req Request object
 * @param res Response object
 */
export const getDistinctMilestoneLevels: RequestHandler = async (req, res) => {
  try {
    const levels = await findDistinctMilestoneLevels();
    res.status(200).json(levels);
  } catch (error: any) {
    console.error('Error in getDistinctMilestoneLevels:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};

/**
 * Create a new milestone.
 * @param req Request object (expects class, level, oid in body)
 * @param res Response object
 */
export const createMilestone: RequestHandler = async (req, res) => {
  const { class: milestoneClass, level, oid } = req.body;

  // Basic validation
  if (milestoneClass === undefined || isNaN(parseInt(milestoneClass)) ||
      !level || typeof level !== 'string' ||
      oid === undefined || isNaN(parseInt(oid))) {
    res.status(400).json({ message: 'Class (number), Level (string), and Offering ID (oid, number) are required' });
    return;
  }

  try {
    const newMilestone = await createNewMilestone({ class: parseInt(milestoneClass), level, oid: parseInt(oid) });

    if (newMilestone === null) {
      res.status(400).json({ message: `Gurukul Offering with ID ${oid} does not exist. Cannot create milestone.` });
      return;
    }

    res.status(201).json(newMilestone);
  } catch (error: any) {
    console.error('Error in createMilestone:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};

/**
 * Update an existing milestone.
 * @param req Request object (expects id in params, optional class, level, oid in body)
 * @param res Response object
 */
export const updateMilestone: RequestHandler = async (req, res) => {
  const mid = parseInt(req.params.id);
  const { class: milestoneClass, level, oid } = req.body;

  if (isNaN(mid)) {
    res.status(400).json({ message: 'Invalid Milestone ID' });
    return;
  }

  // At least one field must be provided for update
  if (milestoneClass === undefined && level === undefined && oid === undefined) {
    res.status(400).json({ message: 'At least one field (class, level, or oid) must be provided for update' });
    return;
  }

  // Validate types if provided
  if (milestoneClass !== undefined && isNaN(parseInt(milestoneClass))) {
    res.status(400).json({ message: 'Class must be a number' });
    return;
  }
  if (level !== undefined && typeof level !== 'string') {
    res.status(400).json({ message: 'Level must be a string' });
    return;
  }
  if (oid !== undefined && isNaN(parseInt(oid))) {
    res.status(400).json({ message: 'Offering ID (oid) must be a number' });
    return;
  }

  try {
    const updatedMilestone = await updateExistingMilestone(mid, {
      class: milestoneClass !== undefined ? parseInt(milestoneClass) : undefined,
      level: level,
      oid: oid !== undefined ? parseInt(oid) : undefined,
    });

    if (updatedMilestone === null) {
      res.status(400).json({ message: `Gurukul Offering with ID ${oid} does not exist. Cannot update milestone.` });
      return;
    }
    if (!updatedMilestone) {
      res.status(404).json({ message: 'Milestone not found' });
      return;
    }

    res.status(200).json(updatedMilestone);
  } catch (error: any) {
    console.error(`Error in updateMilestone (MID: ${mid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};

/**
 * Delete a milestone.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const deleteMilestone: RequestHandler = async (req, res) => {
  const mid = parseInt(req.params.id);
  if (isNaN(mid)) {
    res.status(400).json({ message: 'Invalid Milestone ID' });
    return;
  }

  try {
    const deleted = await deleteMilestoneById(mid);
    if (!deleted) {
      res.status(404).json({ message: 'Milestone not found' });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error in deleteMilestone (MID: ${mid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return;
  }
};

