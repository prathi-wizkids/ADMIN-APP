// routes/topicRoutes.ts - Defines API routes for Topics

import { Router } from 'express';
import {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicController';

const router = Router();

// --- Topic Routes ---

/**
 * @route GET /
 * @description Get all topics
 * Corresponds to http://localhost:5002/topics when mounted at '/topics'
 */
router.get('/', getAllTopics);

/**
 * @route GET /:id
 * @description Get a topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.get('/:id', getTopicById);

/**
 * @route POST /
 * @description Create a new topic
 * Corresponds to http://localhost:5002/topics
 */
router.post('/', createTopic);

/**
 * @route PUT /:id
 * @description Update an existing topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.put('/:id', updateTopic);

/**
 * @route DELETE /:id
 * @description Delete a topic by its ID
 * Corresponds to http://localhost:5002/topics/:id
 */
router.delete('/:id', deleteTopic);

export default router;

