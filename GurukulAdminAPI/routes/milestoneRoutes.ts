// routes/milestoneRoutes.ts - Defines API routes for Milestones

import { Router } from 'express';
import {
  getAllMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestonesByGurukul,
  getDistinctMilestoneLevels,
} from '../controllers/milestoneController';

const router = Router();

// --- Milestone Routes ---
// Get all milestones for a specific Gurukul ID
router.get('/by-gurukul/:gid', getMilestonesByGurukul); // NEW route

/**
 * @route GET /distinct-levels
 * @description Get all distinct levels that exist in the milestones table.
 * Corresponds to http://localhost:5002/milestones/distinct-levels
 */
router.get('/distinct-levels', getDistinctMilestoneLevels);

/**
 * @route GET /
 * @description Get all milestones
 * Corresponds to http://localhost:5002/milestones when mounted at '/milestones'
 */
router.get('/', getAllMilestones);

/**
 * @route GET /:id
 * @description Get a milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.get('/:id', getMilestoneById);

/**
 * @route POST /
 * @description Create a new milestone
 * Corresponds to http://localhost:5002/milestones
 */
router.post('/', createMilestone);

/**
 * @route PUT /:id
 * @description Update an existing milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.put('/:id', updateMilestone);

/**
 * @route DELETE /:id
 * @description Delete a milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.delete('/:id', deleteMilestone);

export default router;

