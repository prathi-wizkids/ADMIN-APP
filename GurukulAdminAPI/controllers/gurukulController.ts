// controllers/gurukulController.ts - Handles the logic for Gurukul and Gurukul Offerings CRUD operations
// Now uses gurukulService for business logic and handles async operations.
// Corrected: Explicitly returns void after sending responses to satisfy RequestHandler type.

import { Request, Response, RequestHandler } from 'express';
import {
  findAllGurukuls,
  findGurukulById,
  createNewGurukul,
  updateExistingGurukul,
  deleteGurukulAndOfferings,
  findAllGurukulOfferings,
  findGurukulOfferingById,
  createNewGurukulOffering,
  updateExistingGurukulOffering,
  deleteGurukulOfferingById,
  getGurukulOfferingsByGid,
} from '../services/gurukulService'; // Import service functions

// --- Gurukul Controller Functions ---

/**
 * Get all gurukuls.
 * @param req Request object
 * @param res Response object
 */
export const getAllGurukuls: RequestHandler = async (req, res) => {
  try {
    const gurukuls = await findAllGurukuls();
    res.status(200).json(gurukuls);
    // No 'return' needed here, as this is the final action and implicit return is Promise<void>
  } catch (error: any) {
    console.error('Error in getAllGurukuls:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void to stop execution after sending error
  }
};

/**
 * Get a single gurukul by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const getGurukulById: RequestHandler = async (req, res) => {
  const gid = parseInt(req.params.id);
  if (isNaN(gid)) {
    res.status(400).json({ message: 'Invalid Gurukul ID' });
    return; // Explicitly return void
  }

  try {
    const gurukul = await findGurukulById(gid);
    if (!gurukul) {
      res.status(404).json({ message: 'Gurukul not found' });
      return; // Explicitly return void
    }
    res.status(200).json(gurukul);
  } catch (error: any) {
    console.error(`Error in getGurukulById (GID: ${gid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Create a new gurukul.
 * @param req Request object (expects gname in body)
 * @param res Response object
 */
export const createGurukul: RequestHandler = async (req, res) => {
  const { gname } = req.body;

  if (!gname || typeof gname !== 'string') {
    res.status(400).json({ message: 'Gurukul name (gname) is required and must be a string' });
    return; // Explicitly return void
  }

  try {
    const newGurukul = await createNewGurukul(gname);
    res.status(201).json(newGurukul);
  } catch (error: any) {
    console.error('Error in createGurukul:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Update an existing gurukul.
 * @param req Request object (expects id in params, gname in body)
 * @param res Response object
 */
export const updateGurukul: RequestHandler = async (req, res) => {
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
    const updatedGurukul = await updateExistingGurukul(gid, gname);
    if (!updatedGurukul) {
      res.status(404).json({ message: 'Gurukul not found' });
      return; // Explicitly return void
    }
    res.status(200).json(updatedGurukul);
  } catch (error: any) {
    console.error(`Error in updateGurukul (GID: ${gid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Delete a gurukul.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const deleteGurukul: RequestHandler = async (req, res) => {
  const gid = parseInt(req.params.id);
  if (isNaN(gid)) {
    res.status(400).json({ message: 'Invalid Gurukul ID' });
    return; // Explicitly return void
  }

  try {
    const deleted = await deleteGurukulAndOfferings(gid);
    if (!deleted) {
      res.status(404).json({ message: 'Gurukul not found' });
      return; // Explicitly return void
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error in deleteGurukul (GID: ${gid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

// --- Gurukul Offering Controller Functions ---

/**
 * Get all gurukul offerings.
 * @param req Request object
 * @param res Response object
 */
export const getAllGurukulOfferings: RequestHandler = async (req, res) => {
  try {
    const offerings = await findAllGurukulOfferings();
    res.status(200).json(offerings);
  } catch (error: any) {
    console.error('Error in getAllGurukulOfferings:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Get a single gurukul offering by ID.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const getGurukulOfferingById: RequestHandler = async (req, res) => {
  const oid = parseInt(req.params.id);
  if (isNaN(oid)) {
    res.status(400).json({ message: 'Invalid Gurukul Offering ID' });
    return; // Explicitly return void
  }

  try {
    const offering = await findGurukulOfferingById(oid);
    if (!offering) {
      res.status(404).json({ message: 'Gurukul Offering not found' });
      return; // Explicitly return void
    }
    res.status(200).json(offering);
  } catch (error: any) {
    console.error(`Error in getGurukulOfferingById (OID: ${oid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

export const getOfferingsByGid: RequestHandler = async (req, res) => {
  try {
    const gidParam = req.query.gid as string;

    if (!gidParam) {
      res.status(400).json({ message: 'Missing required query param: gid' });
      return;
    }

    const gid = parseInt(gidParam, 10);
    if (isNaN(gid)) {
      res.status(400).json({ message: 'gid must be a valid integer' });
      return;
    }

    const offerings = await getGurukulOfferingsByGid(gid);
    res.status(200).json(offerings); 
  } catch (error) {
    console.error('Error in getOfferingsByGid:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Create a new gurukul offering.
 * @param req Request object (expects gid, gtype in body)
 * @param res Response object
 */
export const createGurukulOffering: RequestHandler = async (req, res) => {
  const { gid, gtype } = req.body;

  if (gid === undefined || isNaN(parseInt(gid)) || !gtype || typeof gtype !== 'string') {
    res.status(400).json({ message: 'Gurukul ID (gid, number) and type (gtype, string) are required' });
    return; // Explicitly return void
  }

  try {
    const newOffering = await createNewGurukulOffering(parseInt(gid), gtype);

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
  } catch (error: any) {
    console.error('Error in createGurukulOffering:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Update an existing gurukul offering.
 * @param req Request object (expects id in params, gid, gtype in body)
 * @param res Response object
 */
export const updateGurukulOffering: RequestHandler = async (req, res) => {
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
    const updatedOffering = await updateExistingGurukulOffering(oid, parseInt(gid), gtype);

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
  } catch (error: any) {
    console.error(`Error in updateGurukulOffering (OID: ${oid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

/**
 * Delete a gurukul offering.
 * @param req Request object (expects id in params)
 * @param res Response object
 */
export const deleteGurukulOffering: RequestHandler = async (req, res) => {
  const oid = parseInt(req.params.id);
  if (isNaN(oid)) {
    res.status(400).json({ message: 'Invalid Gurukul Offering ID' });
    return; // Explicitly return void
  }

  try {
    const deleted = await deleteGurukulOfferingById(oid);
    if (!deleted) {
      res.status(404).json({ message: 'Gurukul Offering not found' });
      return; // Explicitly return void
    }
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error in deleteGurukulOffering (OID: ${oid}):`, error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
    return; // Explicitly return void
  }
};

