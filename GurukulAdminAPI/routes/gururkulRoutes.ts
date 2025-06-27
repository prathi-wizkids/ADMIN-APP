// routes/gurukulRoutes.ts - Defines API routes for Gurukuls and Gurukul Offerings

import { Router } from 'express';
import {
  getAllGurukuls,
  getGurukulById,
  createGurukul,
  updateGurukul,
  deleteGurukul,
  getAllGurukulOfferings,
  getGurukulOfferingById,
  createGurukulOffering,
  updateGurukulOffering,
  deleteGurukulOffering,
  getOfferingsByGid,
} from '../controllers/gurukulController';

const router = Router();

// --- Base Router Route ---
/**
 * @route GET /
 * @description Provides a welcome message for the Gurukul API when accessed at its root.
 * This will respond to http://localhost:5002/ after mounting.
 */
 router.get('/', (req, res) => {
     res.send('Welcome to the Gurukul Admin API (Gurukul routes mounted here)!');
    });


// --- Gurukul Routes ---

/**
 * @route GET /api/gurukul
 * @description Get all gurukuls
 */
router.get('/gurukul', getAllGurukuls);

/**
 * @route GET /api/gurukul/:id
 * @description Get a gurukul by its ID
 */
router.get('/gurukul/:id', getGurukulById);

/**
 * @route POST /api/gurukul
 * @description Create a new gurukul
 */
router.post('/gurukul', createGurukul);

/**
 * @route PUT /api/gurukul/:id
 * @description Update an existing gurukul by its ID
 */
router.put('/gurukul/:id', updateGurukul);

/**
 * @route DELETE /api/gurukul/:id
 * @description Delete a gurukul by its ID
 */
router.delete('/gurukul/:id', deleteGurukul);

// --- Gurukul Offerings Routes ---

/**
 * @route GET /api/gurukul-offerings
 * @description Get all gurukul offerings
 */
router.get('/gurukul-offerings', getAllGurukulOfferings);

/**
 * @route GET /api/gurukul-offerings/:id
 * @description Get a gurukul offering by its ID
 */
router.get('/gurukul-offerings/:id', getGurukulOfferingById);

// Add this line after existing routes
router.get('/gurukul-offerings/by-gid', getOfferingsByGid);

/**
 * @route POST /api/gurukul-offerings
 * @description Create a new gurukul offering
 */
router.post('/gurukul-offerings', createGurukulOffering);

/**
 * @route PUT /api/gurukul-offerings/:id
 * @description Update an existing gurukul offering by its ID
 */
router.put('/gurukul-offerings/:id', updateGurukulOffering);

/**
 * @route DELETE /api/gurukul-offerings/:id
 * @description Delete a gurukul offering by its ID
 */
router.delete('/gurukul-offerings/:id', deleteGurukulOffering);

export default router;
