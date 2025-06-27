"use strict";
// services/subjectService.ts - Handles the core business logic for Subjects
// Interacts with the teachmate.subjects table and uses corrected column names.
// Corrected: Explicit null checks for rowCount and added image_url to create.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubjectById = exports.updateExistingSubject = exports.createNewSubject = exports.findSubjectsByLevel = exports.findSubjectById = exports.findAllSubjects = void 0;
const db_1 = __importDefault(require("../utils/db")); // Import the database connection pool
const milestoneService_1 = require("./milestoneService"); // Corrected: LEVEL_MAPPING is now exported
/**
 * Helper function to check if a level string is valid (exists in LEVEL_MAPPING).
 * @param level The level string (e.g., L1, L5).
 * @returns True if the level is valid, false otherwise.
 */
const isValidLevel = (level) => {
    // Check if the level exists as a value in any of the gtype arrays in LEVEL_MAPPING
    return Object.values(milestoneService_1.LEVEL_MAPPING).some(levels => levels.includes(level));
};
// --- Subject Service Functions ---
/**
 * Retrieves all subjects from the database.
 * @returns A Promise that resolves to an array of Subject objects.
 */
const findAllSubjects = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Corrected table and column names
        const result = yield db_1.default.query('SELECT subid, subname, level, image_url, isdeleted FROM teachmate.subjects ORDER BY subid ASC');
        return result.rows;
    }
    catch (error) {
        console.error('Error in findAllSubjects:', error);
        throw new Error('Could not retrieve subjects');
    }
});
exports.findAllSubjects = findAllSubjects;
/**
 * Retrieves a single subject by its ID from the database.
 * @param subid The ID of the subject.
 * @returns A Promise that resolves to the Subject object if found, otherwise undefined.
 */
const findSubjectById = (subid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Corrected table and column names
        const result = yield db_1.default.query('SELECT subid, subname, level, image_url, isdeleted FROM teachmate.subjects WHERE subid = $1', [subid]);
        return result.rows[0]; // Returns undefined if no row is found
    }
    catch (error) {
        console.error(`Error in findSubjectById (SUBID: ${subid}):`, error);
        throw new Error(`Could not retrieve subject with ID ${subid}`);
    }
});
exports.findSubjectById = findSubjectById;
/**
 * Retrieves subjects by their level from the database.
 * @param level The level of the subjects.
 * @returns A Promise that resolves to an array of Subject objects.
 */
const findSubjectsByLevel = (level) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Corrected table and column names
        const result = yield db_1.default.query('SELECT subid, subname, level, image_url, isdeleted FROM teachmate.subjects WHERE level = $1 ORDER BY subname ASC', [level]);
        return result.rows;
    }
    catch (error) {
        console.error(`Error in findSubjectsByLevel (Level: ${level}):`, error);
        throw new Error(`Could not retrieve subjects for level ${level}`);
    }
});
exports.findSubjectsByLevel = findSubjectsByLevel;
/**
 * Creates a new subject in the database.
 * Validates the level and prevents duplicate subject names for the same level.
 * @param subname The name of the subject.
 * @param level The level of the subject (e.g., L1, L5).
 * @param image_url Optional URL for the subject image.
 * @returns A Promise that resolves to the newly created Subject object.
 * Returns undefined if the level is invalid.
 * Returns false if a subject with the same name and level already exists.
 */
const createNewSubject = (subname, level, image_url) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Validate the level
    if (!isValidLevel(level)) {
        return undefined; // Indicate invalid level
    }
    try {
        // 2. Check for duplicate subject (same subname and level)
        const existingSubject = yield db_1.default.query('SELECT subid FROM teachmate.subjects WHERE subname = $1 AND level = $2', // Corrected table and column names
        [subname, level]);
        if (existingSubject.rowCount != null && existingSubject.rowCount > 0) { // Added null check
            return false; // Indicate duplicate subject
        }
        console.log("createNewSubject Service: Not duplicate");
        // Note: Assuming 'subid' is handled by an IDENTITY column or SERIAL in your database.
        // image_url is now included in the insert. isdeleted is assumed to have a default value.
        const result = yield db_1.default.query('INSERT INTO teachmate.subjects (subname, level, image_url) VALUES ($1, $2, $3) RETURNING subid, subname, level, image_url, isdeleted', // Corrected table and column names, added image_url
        [subname, level, image_url]);
        console.table(result.rows);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error in createNewSubject:', error);
        throw new Error('Could not create subject');
    }
});
exports.createNewSubject = createNewSubject;
/**
 * Updates an existing subject in the database.
 * Validates the level (if changed) and prevents updates that would create a duplicate.
 * @param subid The ID of the subject to update.
 * @param subjectData Object containing optional subname, level, and image_url.
 * @returns A Promise that resolves to the updated Subject object if successful, otherwise undefined (if not found).
 * Returns undefined if level is invalid (if changed).
 * Returns false if the update would create a duplicate subject.
 * Returns '404' string if subject itself is not found.
 */
const updateExistingSubject = (subid, subjectData) => __awaiter(void 0, void 0, void 0, function* () {
    const { subname, level, image_url } = subjectData;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    // Fetch current subject data for comparison
    const currentSubject = yield (0, exports.findSubjectById)(subid); // Corrected to use subid
    if (!currentSubject) {
        return '404'; // Subject not found
    }
    const targetSname = subname !== undefined ? subname : currentSubject.subname; // Corrected to subname
    const targetLevel = level !== undefined ? level : currentSubject.level;
    // 1. Validate the new/updated level if provided
    if (level !== undefined && !isValidLevel(level)) {
        return undefined; // Invalid level
    }
    // Also check if current level becomes invalid after changing it, although the client should prevent this
    // or if subname/level are changed such that it conflicts.
    // 2. Check for duplicate subject (subname and level) with another subject (excluding self)
    const existingDuplicateSubject = yield db_1.default.query('SELECT subid FROM teachmate.subjects WHERE subname = $1 AND level = $2 AND subid != $3', // Corrected table and column names
    [targetSname, targetLevel, subid]);
    if (existingDuplicateSubject.rowCount != null && existingDuplicateSubject.rowCount > 0) { // Added null check
        return false; // This update would create a duplicate subject
    }
    if (subname !== undefined) {
        fields.push(`subname = $${paramIndex++}`); // Corrected to subname
        values.push(subname);
    }
    if (level !== undefined) {
        fields.push(`level = $${paramIndex++}`);
        values.push(level);
    }
    if (image_url !== undefined) { // Added image_url update
        fields.push(`image_url = $${paramIndex++}`);
        values.push(image_url);
    }
    if (fields.length === 0) {
        return currentSubject; // No fields to update
    }
    values.push(subid); // Add subid for the WHERE clause
    const query = `UPDATE teachmate.subjects SET ${fields.join(', ')} WHERE subid = $${paramIndex} RETURNING subid, subname, level, image_url, isdeleted`; // Corrected table and column names
    try {
        const result = yield db_1.default.query(query, values);
        return result.rows[0]; // Returns undefined if no row was updated (should be caught by 404 check above)
    }
    catch (error) {
        console.error(`Error in updateExistingSubject (SUBID: ${subid}):`, error);
        throw new Error(`Could not update subject with ID ${subid}`);
    }
});
exports.updateExistingSubject = updateExistingSubject;
/**
 * Deletes a subject and its associated topics from the database.
 * Uses a transaction to ensure atomicity.
 * @param subid The ID of the subject to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if subject not found.
 */
const deleteSubjectById = (subid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const client = yield db_1.default.connect();
    try {
        yield client.query('BEGIN');
        // First, delete associated topics
        // Corrected table and column names
        const deleteTopicsResult = yield client.query('DELETE FROM teachmate.topics WHERE subid = $1 RETURNING tid', [subid]);
        console.log(`Deleted ${(_a = deleteTopicsResult.rowCount) !== null && _a !== void 0 ? _a : 0} topics for subject ID ${subid}`);
        // Then, delete the subject itself
        // Corrected table and column names
        const deleteSubjectResult = yield client.query('DELETE FROM teachmate.subjects WHERE subid = $1 RETURNING subid', [subid]);
        yield client.query('COMMIT');
        return ((_b = deleteSubjectResult.rowCount) !== null && _b !== void 0 ? _b : 0) > 0; // Corrected to use nullish coalescing for safety
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error(`Error in deleteSubjectById (SUBID: ${subid}):`, error);
        throw new Error(`Could not delete subject with ID ${subid} and its topics`);
    }
    finally {
        client.release();
    }
});
exports.deleteSubjectById = deleteSubjectById;
