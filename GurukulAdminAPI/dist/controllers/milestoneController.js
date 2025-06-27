"use strict";
// controllers/milestoneController.ts - Handles the logic for Milestone CRUD operations
// Uses milestoneService for business logic and handles async operations.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMilestone = exports.updateMilestone = exports.createMilestone = exports.getDistinctMilestoneLevels = exports.getMilestoneById = exports.getMilestonesByGurukul = exports.getAllMilestones = void 0;
const milestoneService_1 = require("../services/milestoneService"); // Import milestone service functions
// --- Milestone Controller Functions ---
/**
 * Get all milestones.
 * @param req Request object
 * @param res Response object
 */
const getAllMilestones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const milestones = yield (0, milestoneService_1.findAllMilestones)();
        res.status(200).json(milestones);
    }
    catch (error) {
        console.error('Error in getAllMilestones:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getAllMilestones = getAllMilestones;
const getMilestonesByGurukul = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gid = parseInt(req.params.gid);
    console.log("I AM HERE IN getMilestonesByGurukul Controller");
    if (isNaN(gid)) {
        res.status(400).json({ message: 'Invalid Gurukul ID' });
        return;
    }
    try {
        const milestones = yield (0, milestoneService_1.findAllMilestonesbyGid)(gid);
        res.status(200).json(milestones);
    }
    catch (error) {
        console.error(`Error in getMilestonesByGurukul (GID: ${gid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
    }
});
exports.getMilestonesByGurukul = getMilestonesByGurukul;
/**
 * Get a single milestone by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const getMilestoneById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mid = parseInt(req.params.id);
    if (isNaN(mid)) {
        res.status(400).json({ message: 'Invalid Milestone ID' });
        return;
    }
    try {
        const milestone = yield (0, milestoneService_1.findMilestoneById)(mid);
        if (!milestone) {
            res.status(404).json({ message: 'Milestone not found' });
            return;
        }
        res.status(200).json(milestone);
    }
    catch (error) {
        console.error(`Error in getMilestoneById (MID: ${mid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getMilestoneById = getMilestoneById;
/**
 * Get all distinct levels from the milestones table.
 * @param req Request object
 * @param res Response object
 */
const getDistinctMilestoneLevels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const levels = yield (0, milestoneService_1.findDistinctMilestoneLevels)();
        res.status(200).json(levels);
    }
    catch (error) {
        console.error('Error in getDistinctMilestoneLevels:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getDistinctMilestoneLevels = getDistinctMilestoneLevels;
/**
 * Create a new milestone.
 * @param req Request object (expects class, level, oid in body)
 * @param res Response object
 */
const createMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { class: milestoneClass, level, oid } = req.body;
    // Basic validation
    if (milestoneClass === undefined || isNaN(parseInt(milestoneClass)) ||
        !level || typeof level !== 'string' ||
        oid === undefined || isNaN(parseInt(oid))) {
        res.status(400).json({ message: 'Class (number), Level (string), and Offering ID (oid, number) are required' });
        return;
    }
    try {
        const newMilestone = yield (0, milestoneService_1.createNewMilestone)({ class: parseInt(milestoneClass), level, oid: parseInt(oid) });
        if (newMilestone === null) {
            res.status(400).json({ message: `Gurukul Offering with ID ${oid} does not exist. Cannot create milestone.` });
            return;
        }
        res.status(201).json(newMilestone);
    }
    catch (error) {
        console.error('Error in createMilestone:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.createMilestone = createMilestone;
/**
 * Update an existing milestone.
 * @param req Request object (expects id in params, optional class, level, oid in body)
 * @param res Response object
 */
const updateMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updatedMilestone = yield (0, milestoneService_1.updateExistingMilestone)(mid, {
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
    }
    catch (error) {
        console.error(`Error in updateMilestone (MID: ${mid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.updateMilestone = updateMilestone;
/**
 * Delete a milestone.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const deleteMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mid = parseInt(req.params.id);
    if (isNaN(mid)) {
        res.status(400).json({ message: 'Invalid Milestone ID' });
        return;
    }
    try {
        const deleted = yield (0, milestoneService_1.deleteMilestoneById)(mid);
        if (!deleted) {
            res.status(404).json({ message: 'Milestone not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error in deleteMilestone (MID: ${mid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.deleteMilestone = deleteMilestone;
