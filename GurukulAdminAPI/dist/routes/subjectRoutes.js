"use strict";
// routes/subjectRoutes.ts - Defines API routes for Subjects
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectController_1 = require("../controllers/subjectController");
const router = (0, express_1.Router)();
// --- Subject Routes ---
/**
 * @route GET /
 * @description Get all subjects
 * Corresponds to http://localhost:5002/subjects when mounted at '/subjects'
 */
router.get('/', subjectController_1.getAllSubjects);
/**
 * @route GET /:id
 * @description Get a subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.get('/:id', subjectController_1.getSubjectById);
/**
 * @route POST /
 * @description Create a new subject
 * Corresponds to http://localhost:5002/subjects
 */
router.post('/', subjectController_1.createSubject);
/**
 * @route PUT /:id
 * @description Update an existing subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.put('/:id', subjectController_1.updateSubject);
/**
 * @route DELETE /:id
 * @description Delete a subject by its ID
 * Corresponds to http://localhost:5002/subjects/:id
 */
router.delete('/:id', subjectController_1.deleteSubject);
exports.default = router;
