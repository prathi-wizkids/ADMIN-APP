"use strict";
// controllers/gurukulController.ts - Handles the logic for Gurukul and Gurukul Offerings CRUD operations
// Now uses gurukulService for business logic and handles async operations.
// Corrected: Explicitly returns void after sending responses to satisfy RequestHandler type.
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
exports.deleteGurukulOffering = exports.updateGurukulOffering = exports.createGurukulOffering = exports.getOfferingsByGid = exports.getGurukulOfferingById = exports.getAllGurukulOfferings = exports.deleteGurukul = exports.updateGurukul = exports.createGurukul = exports.getGurukulById = exports.getAllGurukuls = void 0;
const gurukulService_1 = require("../services/gurukulService"); // Import service functions
// --- Gurukul Controller Functions ---
/**
 * Get all gurukuls.
 * @param req Request object
 * @param res Response object
 */
const getAllGurukuls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gurukuls = yield (0, gurukulService_1.findAllGurukuls)();
        res.status(200).json(gurukuls);
        // No 'return' needed here, as this is the final action and implicit return is Promise<void>
    }
    catch (error) {
        console.error('Error in getAllGurukuls:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void to stop execution after sending error
    }
});
exports.getAllGurukuls = getAllGurukuls;
/**
 * Get a single gurukul by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const getGurukulById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gid = parseInt(req.params.id);
    if (isNaN(gid)) {
        res.status(400).json({ message: 'Invalid Gurukul ID' });
        return; // Explicitly return void
    }
    try {
        const gurukul = yield (0, gurukulService_1.findGurukulById)(gid);
        if (!gurukul) {
            res.status(404).json({ message: 'Gurukul not found' });
            return; // Explicitly return void
        }
        res.status(200).json(gurukul);
    }
    catch (error) {
        console.error(`Error in getGurukulById (GID: ${gid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.getGurukulById = getGurukulById;
/**
 * Create a new gurukul.
 * @param req Request object (expects gname in body)
 * @param res Response object
 */
const createGurukul = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gname } = req.body;
    if (!gname || typeof gname !== 'string') {
        res.status(400).json({ message: 'Gurukul name (gname) is required and must be a string' });
        return; // Explicitly return void
    }
    try {
        const newGurukul = yield (0, gurukulService_1.createNewGurukul)(gname);
        res.status(201).json(newGurukul);
    }
    catch (error) {
        console.error('Error in createGurukul:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.createGurukul = createGurukul;
/**
 * Update an existing gurukul.
 * @param req Request object (expects id in params, gname in body)
 * @param res Response object
 */
const updateGurukul = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gid = parseInt(req.params.id);
    const { gname } = req.body;
    if (isNaN(gid)) {
        res.status(400).json({ message: 'Invalid Gurukul ID' });
        return; // Explicitly return void
    }
    if (!gname || typeof gname !== 'string') {
        res.status(400).json({ message: 'Gurukul name (gname) is required for update and must be a string' });
        return; // Explicitly return void
    }
    try {
        const updatedGurukul = yield (0, gurukulService_1.updateExistingGurukul)(gid, gname);
        if (!updatedGurukul) {
            res.status(404).json({ message: 'Gurukul not found' });
            return; // Explicitly return void
        }
        res.status(200).json(updatedGurukul);
    }
    catch (error) {
        console.error(`Error in updateGurukul (GID: ${gid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.updateGurukul = updateGurukul;
/**
 * Delete a gurukul.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const deleteGurukul = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gid = parseInt(req.params.id);
    if (isNaN(gid)) {
        res.status(400).json({ message: 'Invalid Gurukul ID' });
        return; // Explicitly return void
    }
    try {
        const deleted = yield (0, gurukulService_1.deleteGurukulAndOfferings)(gid);
        if (!deleted) {
            res.status(404).json({ message: 'Gurukul not found' });
            return; // Explicitly return void
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error in deleteGurukul (GID: ${gid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.deleteGurukul = deleteGurukul;
// --- Gurukul Offering Controller Functions ---
/**
 * Get all gurukul offerings.
 * @param req Request object
 * @param res Response object
 */
const getAllGurukulOfferings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerings = yield (0, gurukulService_1.findAllGurukulOfferings)();
        res.status(200).json(offerings);
    }
    catch (error) {
        console.error('Error in getAllGurukulOfferings:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.getAllGurukulOfferings = getAllGurukulOfferings;
/**
 * Get a single gurukul offering by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const getGurukulOfferingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const oid = parseInt(req.params.id);
    if (isNaN(oid)) {
        res.status(400).json({ message: 'Invalid Gurukul Offering ID' });
        return; // Explicitly return void
    }
    try {
        const offering = yield (0, gurukulService_1.findGurukulOfferingById)(oid);
        if (!offering) {
            res.status(404).json({ message: 'Gurukul Offering not found' });
            return; // Explicitly return void
        }
        res.status(200).json(offering);
    }
    catch (error) {
        console.error(`Error in getGurukulOfferingById (OID: ${oid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.getGurukulOfferingById = getGurukulOfferingById;
const getOfferingsByGid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gidParam = req.query.gid;
        if (!gidParam) {
            res.status(400).json({ message: 'Missing required query param: gid' });
            return;
        }
        const gid = parseInt(gidParam, 10);
        if (isNaN(gid)) {
            res.status(400).json({ message: 'gid must be a valid integer' });
            return;
        }
        const offerings = yield (0, gurukulService_1.getGurukulOfferingsByGid)(gid);
        res.status(200).json(offerings);
    }
    catch (error) {
        console.error('Error in getOfferingsByGid:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.getOfferingsByGid = getOfferingsByGid;
/**
 * Create a new gurukul offering.
 * @param req Request object (expects gid, gtype in body)
 * @param res Response object
 */
const createGurukulOffering = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gid, gtype } = req.body;
    if (gid === undefined || isNaN(parseInt(gid)) || !gtype || typeof gtype !== 'string') {
        res.status(400).json({ message: 'Gurukul ID (gid, number) and type (gtype, string) are required' });
        return; // Explicitly return void
    }
    try {
        const newOffering = yield (0, gurukulService_1.createNewGurukulOffering)(parseInt(gid), gtype);
        if (newOffering === null) {
            res.status(400).json({ message: `Gurukul with ID ${gid} does not exist.` });
            return; // Explicitly return void
        }
        if (newOffering === undefined) {
            res.status(400).json({ message: `Invalid gtype. Must be one of: G1, G2, G3, G4` });
            return; // Explicitly return void
        }
        if (newOffering === false) { // Handle the case where the offering already exists
            res.status(409).json({ message: `Offering type '${gtype}' already exists for Gurukul ID ${gid}.` });
            return;
        }
        res.status(201).json(newOffering);
    }
    catch (error) {
        console.error('Error in createGurukulOffering:', error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.createGurukulOffering = createGurukulOffering;
/**
 * Update an existing gurukul offering.
 * @param req Request object (expects id in params, gid, gtype in body)
 * @param res Response object
 */
const updateGurukulOffering = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const oid = parseInt(req.params.id);
    const { gid, gtype } = req.body;
    if (isNaN(oid)) {
        res.status(400).json({ message: 'Invalid Gurukul Offering ID' });
        return; // Explicitly return void
    }
    if (gid === undefined || isNaN(parseInt(gid)) || !gtype || typeof gtype !== 'string') {
        res.status(400).json({ message: 'Gurukul ID (gid, number) and type (gtype, string) are required for update' });
        return; // Explicitly return void
    }
    try {
        const updatedOffering = yield (0, gurukulService_1.updateExistingGurukulOffering)(oid, parseInt(gid), gtype);
        if (updatedOffering === false) {
            res.status(404).json({ message: 'Gurukul Offering not found' });
            return; // Explicitly return void
        }
        if (updatedOffering === null) {
            res.status(400).json({ message: `Gurukul with ID ${gid} does not exist.` });
            return; // Explicitly return void
        }
        if (updatedOffering === undefined) {
            res.status(400).json({ message: `Invalid gtype. Must be one of: G1, G2, G3, G4` });
            return; // Explicitly return void
        }
        // If it's undefined (meaning no row was updated), it's a 404, not undefined
        if (!updatedOffering) { // This handles the case where the oid was not found for update
            res.status(404).json({ message: 'Gurukul Offering not found' });
            return;
        }
        res.status(200).json(updatedOffering);
    }
    catch (error) {
        console.error(`Error in updateGurukulOffering (OID: ${oid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.updateGurukulOffering = updateGurukulOffering;
/**
 * Delete a gurukul offering.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
const deleteGurukulOffering = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const oid = parseInt(req.params.id);
    if (isNaN(oid)) {
        res.status(400).json({ message: 'Invalid Gurukul Offering ID' });
        return; // Explicitly return void
    }
    try {
        const deleted = yield (0, gurukulService_1.deleteGurukulOfferingById)(oid);
        if (!deleted) {
            res.status(404).json({ message: 'Gurukul Offering not found' });
            return; // Explicitly return void
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error in deleteGurukulOffering (OID: ${oid}):`, error);
        res.status(500).json({ message: 'Internal Server Error', details: error.message });
        return; // Explicitly return void
    }
});
exports.deleteGurukulOffering = deleteGurukulOffering;
