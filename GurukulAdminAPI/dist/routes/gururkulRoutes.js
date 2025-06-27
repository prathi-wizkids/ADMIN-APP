"use strict";
// routes/gurukulRoutes.ts - Defines API routes for Gurukuls and Gurukul Offerings
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gurukulController_1 = require("../controllers/gurukulController");
const router = (0, express_1.Router)();
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
router.get('/gurukul', gurukulController_1.getAllGurukuls);
/**
 * @route GET /api/gurukul/:id
 * @description Get a gurukul by its ID
 */
router.get('/gurukul/:id', gurukulController_1.getGurukulById);
/**
 * @route POST /api/gurukul
 * @description Create a new gurukul
 */
router.post('/gurukul', gurukulController_1.createGurukul);
/**
 * @route PUT /api/gurukul/:id
 * @description Update an existing gurukul by its ID
 */
router.put('/gurukul/:id', gurukulController_1.updateGurukul);
/**
 * @route DELETE /api/gurukul/:id
 * @description Delete a gurukul by its ID
 */
router.delete('/gurukul/:id', gurukulController_1.deleteGurukul);
// --- Gurukul Offerings Routes ---
/**
 * @route GET /api/gurukul-offerings
 * @description Get all gurukul offerings
 */
router.get('/gurukul-offerings', gurukulController_1.getAllGurukulOfferings);
/**
 * @route GET /api/gurukul-offerings/:id
 * @description Get a gurukul offering by its ID
 */
router.get('/gurukul-offerings/:id', gurukulController_1.getGurukulOfferingById);
// Add this line after existing routes
router.get('/gurukul-offerings/by-gid', gurukulController_1.getOfferingsByGid);
/**
 * @route POST /api/gurukul-offerings
 * @description Create a new gurukul offering
 */
router.post('/gurukul-offerings', gurukulController_1.createGurukulOffering);
/**
 * @route PUT /api/gurukul-offerings/:id
 * @description Update an existing gurukul offering by its ID
 */
router.put('/gurukul-offerings/:id', gurukulController_1.updateGurukulOffering);
/**
 * @route DELETE /api/gurukul-offerings/:id
 * @description Delete a gurukul offering by its ID
 */
router.delete('/gurukul-offerings/:id', gurukulController_1.deleteGurukulOffering);
exports.default = router;
