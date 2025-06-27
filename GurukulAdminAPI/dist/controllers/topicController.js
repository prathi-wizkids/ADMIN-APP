"use strict";
// controllers/topicController.ts - Handles the logic for Topic CRUD operations
// Uses topicService for business logic and handles async operations.
// Corrected: Uses subid consistently.
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
exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getTopicById = exports.getAllTopics = void 0;
const topicService_1 = require("../services/topicService"); // Import topic service functions
// --- Topic Controller Functions ---
/**
 * Get all topics.
 * @param req Request object
 * @param res Response object
 */
const getAllTopics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topics = yield (0, topicService_1.findAllTopics)();
        res.status(200).json(topics);
    }
    catch (error) {
        console.error('Error in getAllTopics:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getAllTopics = getAllTopics;
/**
 * Get a single topic by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const getTopicById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tid = parseInt(req.params.id);
    if (isNaN(tid)) {
        res.status(400).json({ message: 'Invalid Topic ID' });
        return;
    }
    try {
        const topic = yield (0, topicService_1.findTopicById)(tid);
        if (!topic) {
            res.status(404).json({ message: 'Topic not found' });
            return;
        }
        res.status(200).json(topic);
    }
    catch (error) {
        console.error(`Error in getTopicById (TID: ${tid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.getTopicById = getTopicById;
/**
 * Create a new topic.
 * @param req Request object (expects tname, subid in body)
 * @param res Response object
 */
const createTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tname, subid, image_url } = req.body; // Corrected to subid
    console.log("Received request body for createTopic:", req.body);
    if (!tname || typeof tname !== 'string' || subid === undefined || isNaN(parseInt(subid))) {
        res.status(400).json({ message: 'Topic name (tname, string) and Subject ID (subid, number) are required' }); // Corrected to subid
        return;
    }
    try {
        const newTopic = yield (0, topicService_1.createNewTopic)(tname, parseInt(subid), image_url); // Corrected to subid
        if (newTopic === null) {
            res.status(400).json({ message: `Subject with ID ${subid} does not exist. Cannot create topic.` }); // Corrected to subid
            return;
        }
        if (newTopic === false) {
            res.status(409).json({ message: `Topic '${tname}' already exists for Subject ID ${subid}.` }); // Corrected to subid
            return;
        }
        res.status(201).json(newTopic);
    }
    catch (error) {
        console.error('Error in createTopic:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.createTopic = createTopic;
/**
 * Update an existing topic.
 * @param req Request object (expects id in params, optional tname, subid in body)
 * @param res Response object
 */
const updateTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tid = parseInt(req.params.id);
    const { tname, subid, image_url } = req.body; // Corrected to subid, added image_url
    if (isNaN(tid)) {
        res.status(400).json({ message: 'Invalid Topic ID' });
        return;
    }
    // At least one field must be provided for update
    if (tname === undefined && subid === undefined && image_url === undefined) { // Added image_url
        res.status(400).json({ message: 'At least one field (tname, subid, or image_url) must be provided for update' }); // Corrected to subid, added image_url
        return;
    }
    // Validate types if provided
    if (tname !== undefined && typeof tname !== 'string') {
        res.status(400).json({ message: 'Topic name (tname) must be a string' });
        return;
    }
    if (subid !== undefined && isNaN(parseInt(subid))) { // Corrected to subid
        res.status(400).json({ message: 'Subject ID (subid) must be a number' }); // Corrected to subid
        return;
    }
    if (image_url !== undefined && typeof image_url !== 'string') { // Added image_url validation
        res.status(400).json({ message: 'Image URL must be a string' });
        return;
    }
    try {
        const updatedTopic = yield (0, topicService_1.updateExistingTopic)(tid, { tname, subid: subid !== undefined ? parseInt(subid) : undefined, image_url }); // Corrected to subid, added image_url
        if (updatedTopic === '404') {
            res.status(404).json({ message: 'Topic not found.' });
            return;
        }
        if (updatedTopic === null) {
            res.status(400).json({ message: `Subject with ID ${subid} does not exist. Cannot update topic.` }); // Corrected to subid
            return;
        }
        if (updatedTopic === false) {
            res.status(409).json({ message: `Topic '${tname}' already exists for the selected Subject ID ${subid}.` }); // Corrected to subid
            return;
        }
        res.status(200).json(updatedTopic);
    }
    catch (error) {
        console.error(`Error in updateTopic (TID: ${tid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.updateTopic = updateTopic;
/**
 * Delete a topic.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const deleteTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tid = parseInt(req.params.id);
    if (isNaN(tid)) {
        res.status(400).json({ message: 'Invalid Topic ID' });
        return;
    }
    try {
        const deleted = yield (0, topicService_1.deleteTopicById)(tid);
        if (!deleted) {
            res.status(404).json({ message: 'Topic not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error in deleteTopic (TID: ${tid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return;
    }
});
exports.deleteTopic = deleteTopic;
