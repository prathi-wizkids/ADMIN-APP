"use strict";
// routes/topicRoutes.ts - Defines API routes for Topics
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topicController_1 = require("../controllers/topicController");
const router = (0, express_1.Router)();
// --- Topic Routes ---
/**
 * @route GET /
 * @description Get all topics
 * Corresponds to http://localhost:5002/topics when mounted at '/topics'
 */
router.get('/', topicController_1.getAllTopics);
/**
 * @route GET /:id
 * @description Get a topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.get('/:id', topicController_1.getTopicById);
/**
 * @route POST /
 * @description Create a new topic
 * Corresponds to http://localhost:5002/topics
 */
router.post('/', topicController_1.createTopic);
/**
 * @route PUT /:id
 * @description Update an existing topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.put('/:id', topicController_1.updateTopic);
/**
 * @route DELETE /:id
 * @description Delete a topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.delete('/:id', topicController_1.deleteTopic);
exports.default = router;
