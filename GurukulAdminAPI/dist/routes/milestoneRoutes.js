"use strict";
// routes/milestoneRoutes.ts - Defines API routes for Milestones
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milestoneController_1 = require("../controllers/milestoneController");
const router = (0, express_1.Router)();
// --- Milestone Routes ---
// Get all milestones for a specific Gurukul ID
router.get('/by-gurukul/:gid', milestoneController_1.getMilestonesByGurukul); // NEW route
/**
 * @route GET /distinct-levels
 * @description Get all distinct levels that exist in the milestones table.
 * Corresponds to http://localhost:5002/milestones/distinct-levels
 */
router.get('/distinct-levels', milestoneController_1.getDistinctMilestoneLevels);
/**
 * @route GET /
 * @description Get all milestones
 * Corresponds to http://localhost:5002/milestones when mounted at '/milestones'
 */
router.get('/', milestoneController_1.getAllMilestones);
/**
 * @route GET /:id
 * @description Get a milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.get('/:id', milestoneController_1.getMilestoneById);
/**
 * @route POST /
 * @description Create a new milestone
 * Corresponds to http://localhost:5002/milestones
 */
router.post('/', milestoneController_1.createMilestone);
/**
 * @route PUT /:id
 * @description Update an existing milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.put('/:id', milestoneController_1.updateMilestone);
/**
 * @route DELETE /:id
 * @description Delete a milestone by its ID
 * Corresponds to http://localhost:5002/milestones/:id
 */
router.delete('/:id', milestoneController_1.deleteMilestone);
exports.default = router;
