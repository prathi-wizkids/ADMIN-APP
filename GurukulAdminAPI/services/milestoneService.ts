// services/milestoneService.ts - Handles the core business logic for Milestones
// Interacts with the public.milestones table and performs foreign key validation.

import pool from '../utils/db'; // Import the database connection pool
import { findGurukulOfferingById } from './gurukulService'; // Import to validate oid

// --- Level Mapping (MUST be consistent with UI) ---
export const LEVEL_MAPPING: { [key: string]: string[] } = {
  "G1": ["L1", "L2", "L3", "L4"],
  "G2": ["L5", "L6", "L7", "L8"],
  "G3": ["L9", "L10", "L11", "L12"],
  "G4": ["L13", "L14", "L15", "L16"],
};

/**
 * Helper function to check if a level is valid for a given gtype.
 * @param gtype The Gurukul Offering type (e.g., G1, G2).
 * @param level The milestone level (e.g., L1, L5).
 * @returns True if the level is valid for the gtype, false otherwise.
 */
const isValidLevelForGType = (gtype: string, level: string): boolean => {
  const allowedLevels = LEVEL_MAPPING[gtype];
  return allowedLevels ? allowedLevels.includes(level) : false;
};

// --- Milestone Service Functions ---

/**
 * Retrieves all milestones from the database.
 * @returns A Promise that resolves to an array of Milestone objects.
 */
export const findAllMilestones = async (): Promise<any[]> => {
  try {
    const result = await pool.query('SELECT mid, class, level, oid FROM public.milestones ORDER BY mid ASC');
    return result.rows;
  } catch (error) {
    console.error('Error in findAllMilestones:', error);
    throw new Error('Could not retrieve milestones');
  }
};

export const findAllMilestonesbyGid = async (gid: number): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT
          m.mid,
          m.class,
          m.level,
          m.oid
      FROM
          public.milestones m
      JOIN
          public.gurukul_offerings go ON m.oid = go.oid
      WHERE
          go.gid = $1
      ORDER BY
          m.level ASC`,
      [gid]
    );
    console.log(' In findAllMilestonesbyGid --Services- start');
    console.table(result.rows);
    console.log(' In findAllMilestonesbyGid --Services end-');
    
    return result.rows;
  } catch (error) {
    console.error(`Error in findAllMilestonesbyGid (Gurukul ID: ${gid}):`, error);
    throw new Error(`Could not retrieve milestones for Gurukul ID ${gid}`);
  }
};


/**
 * Retrieves a single milestone by its ID from the database.
 * @param mid The ID of the milestone.
 * @returns A Promise that resolves to the Milestone object if found, otherwise undefined.
 */
export const findMilestoneById = async (mid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query('SELECT mid, class, level, oid FROM public.milestones WHERE mid = $1', [mid]);
    return result.rows[0]; // Returns undefined if no row is found
  } catch (error) {
    console.error(`Error in findMilestoneById (MID: ${mid}):`, error);
    throw new Error(`Could not retrieve milestone with ID ${mid}`);
  }
};
/**
 * Retrieves all distinct levels from the public.milestones table.
 * These are the levels that have at least one associated milestone.
 * @returns A Promise that resolves to an array of distinct level strings.
 */
export const findDistinctMilestoneLevels = async (): Promise<string[]> => {
  try {
    const result = await pool.query('SELECT DISTINCT level FROM public.milestones ORDER BY level ASC');
    return result.rows.map(row => row.level);
  } catch (error) {
    console.error('Error in findDistinctMilestoneLevels:', error);
    throw new Error('Could not retrieve distinct milestone levels');
  }
};

/**
 * Creates a new milestone in the database.
 * Validates that the provided 'oid' exists in gurukul_offerings,
 * that the level is valid for the offering's gtype, and prevents duplicate levels for the same offering.
 * @param milestoneData Object containing class, level, and oid.
 * @returns A Promise that resolves to the newly created Milestone object.
 * Returns null if gurukul offering (oid) does not exist.
 * Returns undefined if level is invalid for gtype.
 * Returns false if a duplicate level already exists for this offering.
 */
export const createNewMilestone = async (milestoneData: { class: number; level: string; oid: number }): Promise<any | null | undefined | false> => {
  const { class: milestoneClass, level, oid } = milestoneData;

  try {
    // 1. Validate that the oid (gurukul_offering) exists and get its gtype
    const offering = await findGurukulOfferingById(oid);
    if (!offering) {
      return null; // Indicate that the foreign key (oid) is invalid
    }
    const gtype = offering.gtype;

    // 2. Validate if the provided level is valid for the offering's gtype
    if (!isValidLevelForGType(gtype, level)) {
      return undefined; // Indicate level is out of range for this gtype
    }

    // 3. Check for duplicate level for this specific offering (oid)
    const existingMilestone = await pool.query(
      'SELECT mid FROM public.milestones WHERE oid = $1 AND level = $2',
      [oid, level]
    );
    if (existingMilestone.rowCount != null && existingMilestone.rowCount > 0) {
      return false; // Indicate duplicate level for this offering
    }

    // Note: Assuming 'mid' is handled by an IDENTITY column or SERIAL in your database.
    const result = await pool.query(
      'INSERT INTO public.milestones (class, level, oid) VALUES ($1, $2, $3) RETURNING mid, class, level, oid',
      [milestoneClass, level, oid]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in createNewMilestone:', error);
    throw new Error('Could not create milestone');
  }
};


/**
 * Updates an existing milestone in the database.
 * Validates that the provided 'oid' exists, that the level is valid for the gtype,
 * and prevents updates that would create a duplicate level for the same offering.
 * @param mid The ID of the milestone to update.
 * @param milestoneData Object containing optional class, level, and oid.
 * @returns A Promise that resolves to the updated Milestone object if successful, otherwise undefined (if not found).
 * Returns null if gurukul offering (oid) does not exist.
 * Returns undefined if level is invalid for gtype.
 * Returns false if the update would create a duplicate level for this offering.
 * Returns 404 string if milestone itself is not found.
 */
export const updateExistingMilestone = async (mid: number, milestoneData: { class?: number; level?: string; oid?: number }): Promise<any | null | undefined | false | '404'> => {
  const { class: milestoneClass, level, oid } = milestoneData;
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Fetch current milestone data to get its existing oid/level for comparison
  const currentMilestone = await findMilestoneById(mid);
  if (!currentMilestone) {
    return '404'; // Milestone not found
  }

  // Determine the target OID and GType for validation
  const targetOid = oid !== undefined ? oid : currentMilestone.oid;
  const targetLevel = level !== undefined ? level : currentMilestone.level;

  const targetOffering = await findGurukulOfferingById(targetOid);
  if (!targetOffering) {
    return null; // Target Gurukul Offering does not exist
  }
  const targetGtype = targetOffering.gtype;

  // 1. Validate if the new/updated level is valid for the target offering's gtype
  if (level !== undefined && !isValidLevelForGType(targetGtype, level)) {
    return undefined; // Invalid level for target gtype
  }
  // Also check if current level becomes invalid after changing OID
  if (oid !== undefined && !isValidLevelForGType(targetGtype, currentMilestone.level)) {
    return undefined; // Current level is invalid for new target gtype
  }


  // 2. Check for duplicate level for the target offering (excluding self)
  const existingDuplicateMilestone = await pool.query(
    'SELECT mid FROM public.milestones WHERE oid = $1 AND level = $2 AND mid != $3',
    [targetOid, targetLevel, mid]
  );
  if (existingDuplicateMilestone.rowCount != null && existingDuplicateMilestone.rowCount > 0) {
    return false; // This update would create a duplicate level for this offering
  }

  if (milestoneClass !== undefined) {
    fields.push(`class = $${paramIndex++}`);
    values.push(milestoneClass);
  }
  if (level !== undefined) {
    fields.push(`level = $${paramIndex++}`);
    values.push(level);
  }
  if (oid !== undefined) {
    fields.push(`oid = $${paramIndex++}`);
    values.push(oid);
  }

  if (fields.length === 0) {
    // No fields to update, return the current milestone data
    return currentMilestone;
  }

  values.push(mid); // Add mid for the WHERE clause
  const query = `UPDATE public.milestones SET ${fields.join(', ')} WHERE mid = $${paramIndex} RETURNING mid, class, level, oid`;

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Returns undefined if no row was updated (should be caught by 404 check above)
  } catch (error) {
    console.error(`Error in updateExistingMilestone (MID: ${mid}):`, error);
    throw new Error(`Could not update milestone with ID ${mid}`);
  }
};

/**
 * Deletes a milestone from the database.
 * @param mid The ID of the milestone to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if milestone not found.
 */
export const deleteMilestoneById = async (mid: number): Promise<boolean> => {
  try {
    const result = await pool.query('DELETE FROM public.milestones WHERE mid = $1 RETURNING mid', [mid]);
    return (result.rowCount ?? 0) > 0; // True if at least one milestone was deleted
  } catch (error) {
    console.error(`Error in deleteMilestoneById (MID: ${mid}):`, error);
    throw new Error(`Could not delete milestone with ID ${mid}`);
  }
};

