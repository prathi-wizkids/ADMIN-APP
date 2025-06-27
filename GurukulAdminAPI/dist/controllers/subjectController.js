"use strict";
// controllers/subjectController.ts - Handles the logic for Subject CRUD operations
// Uses subjectService for business logic and handles async operations.
// Corrected: Uses subid and subname consistently.
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
exports.deleteSubject = exports.updateSubject = exports.createSubject = exports.getSubjectById = exports.getAllSubjects = void 0;
const subjectService_1 = require("../services/subjectService"); // Import subject service functions
// --- Subject Controller Functions ---
/**
 * Get all subjects.
 * @param req Request object
 * @param res Response object
 */
const getAllSubjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subjects = yield (0, subjectService_1.findAllSubjects)();
        res.status(200).json(subjects);
    }
    catch (error) {
        console.error('Error in getAllSubjects:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getAllSubjects = getAllSubjects;
/**
 * Get a single subject by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const getSubjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subid = parseInt(req.params.id); // Corrected to subid
    if (isNaN(subid)) {
        res.status(400).json({ message: 'Invalid Subject ID' });
        return;
    }
    try {
        const subject = yield (0, subjectService_1.findSubjectById)(subid); // Corrected to subid
        if (!subject) {
            res.status(404).json({ message: 'Subject not found' });
            return;
        }
        res.status(200).json(subject);
    }
    catch (error) {
        console.error(`Error in getSubjectById (SUBID: ${subid}):`, error); // Corrected to SUBID
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getSubjectById = getSubjectById;
/**
 * Create a new subject.
 * @param req Request object (expects subname, level in body)
 * @param res Response object
 */
const createSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subname, level, image_url } = req.body; // Corrected to subname
    console.log("Received request body for createSubject:", req.body);
    console.log("sname:%s", subname);
    console.log("level:%s", level);
    console.log("image_url:%s", image_url);
    if (!subname || typeof subname !== 'string' || !level || typeof level !== 'string') {
        res.status(400).json({ message: 'Subject name (sname, string) and level (string) are required' }); // Corrected to subname
        return;
    }
    try {
        console.log("Going to createNewSubject ");
        const newSubject = yield (0, subjectService_1.createNewSubject)(subname, level, image_url); // Corrected to subname
        if (newSubject === undefined) {
            res.status(400).json({ message: `Level '${level}' is not a valid predefined level (L1-L16).` });
            return;
        }
        if (newSubject === false) {
            res.status(409).json({ message: `Subject '${subname}' with level '${level}' already exists.` }); // Corrected to subname
            return;
        }
        res.status(201).json(newSubject);
    }
    catch (error) {
        console.error('Error in createSubject:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.createSubject = createSubject;
/**
 * Update an existing subject.
 * @param req Request object (expects id in params, optional subname, level in body)
 * @param res Response object
 */
const updateSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subid = parseInt(req.params.id); // Corrected to subid
    const { subname, level, image_url } = req.body; // Corrected to subname, added image_url
    if (isNaN(subid)) {
        res.status(400).json({ message: 'Invalid Subject ID' });
        return;
    }
    // At least one field must be provided for update
    if (subname === undefined && level === undefined && image_url === undefined) { // Added image_url
        res.status(400).json({ message: 'At least one field (subname, level, or image_url) must be provided for update' }); // Corrected to subname, added image_url
        return;
    }
    // Validate types if provided
    if (subname !== undefined && typeof subname !== 'string') { // Corrected to subname
        res.status(400).json({ message: 'Subject name (subname) must be a string' }); // Corrected to subname
        return;
    }
    if (level !== undefined && typeof level !== 'string') {
        res.status(400).json({ message: 'Level must be a string' });
        return;
    }
    if (image_url !== undefined && typeof image_url !== 'string') { // Added image_url validation
        res.status(400).json({ message: 'Image URL must be a string' });
        return;
    }
    try {
        const updatedSubject = yield (0, subjectService_1.updateExistingSubject)(subid, { subname, level, image_url }); // Corrected to subname, added image_url
        if (updatedSubject === '404') {
            res.status(404).json({ message: 'Subject not found.' });
            return;
        }
        if (updatedSubject === undefined) {
            res.status(400).json({ message: `Level '${level}' is not a valid predefined level (L1-L16).` });
            return;
        }
        if (updatedSubject === false) {
            res.status(409).json({ message: `Subject '${subname}' with level '${level}' already exists for another subject.` }); // Corrected to subname
            return;
        }
        res.status(200).json(updatedSubject);
    }
    catch (error) {
        console.error(`Error in updateSubject (SUBID: ${subid}):`, error); // Corrected to SUBID
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.updateSubject = updateSubject;
/**
 * Delete a subject.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const deleteSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subid = parseInt(req.params.id); // Corrected to subid
    if (isNaN(subid)) {
        res.status(400).json({ message: 'Invalid Subject ID' });
        return;
    }
    try {
        const deleted = yield (0, subjectService_1.deleteSubjectById)(subid); // Corrected to subid
        if (!deleted) {
            res.status(404).json({ message: 'Subject not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error in deleteSubject (SUBID: ${subid}):`, error); // Corrected to SUBID
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.deleteSubject = deleteSubject;
