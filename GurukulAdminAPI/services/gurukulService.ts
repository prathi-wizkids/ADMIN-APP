// services/gurukulService.ts - Handles the core business logic for Gurukuls and Gurukul Offerings
// Now interacts with the PostgreSQL database and safely handles rowCount.

import pool from '../utils/db'; // Import the database connection pool

// --- Gurukul Service Functions ---

/**
 * Retrieves all gurukuls from the database.
 * @returns A Promise that resolves to an array of Gurukul objects.
 */
export const findAllGurukuls = async (): Promise<any[]> => {
  try {
    const result = await pool.query('SELECT gid, gname FROM public.gurukul ORDER BY gid ASC');
    console.log("In findAllGurukuls");
    console.table(result.rows);
    return result.rows;
  } catch (error) {
    console.error('Error in findAllGurukuls:', error);
    throw new Error('Could not retrieve gurukuls');
  }
};

/**
 * Retrieves a single gurukul by its ID from the database.
 * @param gid The ID of the gurukul.
 * @returns A Promise that resolves to the Gurukul object if found, otherwise undefined.
 */
export const findGurukulById = async (gid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query('SELECT gid, gname FROM public.gurukul WHERE gid = $1', [gid]);
    console.log("In findGurukulById");
    return result.rows[0]; // Returns undefined if no row is found
  } catch (error) {
    console.error(`Error in findGurukulById (GID: ${gid}):`, error);
    throw new Error(`Could not retrieve gurukul with ID ${gid}`);
  }
};

/**
 * Creates a new gurukul in the database.
 * @param gname The name of the gurukul.
 * @returns A Promise that resolves to the newly created Gurukul object.
 */
export const createNewGurukul = async (gname: string): Promise<any> => {
  try {
    // Note: Assuming `gid` is handled by an IDENTITY column or SERIAL in your database for auto-increment.
    const result = await pool.query(
      'INSERT INTO public.gurukul (gname) VALUES ($1) RETURNING gid, gname',
      [gname]
    );
    console.log("In createNewGurukul");
    return result.rows[0];
  } catch (error) {
    console.error('Error in createNewGurukul:', error);
    throw new Error('Could not create gurukul');
  }
};

/**
 * Updates an existing gurukul in the database.
 * @param gid The ID of the gurukul to update.
 * @param gname The new name for the gurukul.
 * @returns A Promise that resolves to the updated Gurukul object if successful, otherwise undefined (if not found).
 */
export const updateExistingGurukul = async (gid: number, gname: string): Promise<any | undefined> => {
  try {
    const result = await pool.query(
      'UPDATE public.gurukul SET gname = $1 WHERE gid = $2 RETURNING gid, gname',
      [gname, gid]
    );
    console.log("updateExistingGurukul");
    return result.rows[0]; // Returns undefined if no row was updated
  } catch (error) {
    console.error(`Error in updateExistingGurukul (GID: ${gid}):`, error);
    throw new Error(`Could not update gurukul with ID ${gid}`);
  }
};

/**
 * Deletes a gurukul and its associated offerings from the database.
 * Uses a transaction to ensure atomicity.
 * @param gid The ID of the gurukul to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if gurukul not found.
 */
export const deleteGurukulAndOfferings = async (gid: number): Promise<boolean> => {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query('BEGIN'); // Start transaction

    // First, delete associated gurukul offerings
    const deleteOfferingsResult = await client.query('DELETE FROM public.gurukul_offerings WHERE gid = $1 RETURNING oid', [gid]);
    console.log(`Deleted ${deleteOfferingsResult.rowCount ?? 0} offerings for gurukul ID ${gid}`); // Safely use rowCount

    // Then, delete the gurukul itself
    const deleteGurukulResult = await client.query('DELETE FROM public.gurukul WHERE gid = $1 RETURNING gid', [gid]);

    await client.query('COMMIT'); // Commit transaction

    return (deleteGurukulResult.rowCount ?? 0) > 0; // Safely use rowCount
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error(`Error in deleteGurukulAndOfferings (GID: ${gid}):`, error);
    throw new Error(`Could not delete gurukul with ID ${gid} and its offerings`);
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// --- Gurukul Offering Service Functions ---

/**
 * Retrieves all gurukul offerings from the database.
 * @returns A Promise that resolves to an array of GurukulOffering objects.
 */
export const findAllGurukulOfferings = async (): Promise<any[]> => {
  try {
    const result = await pool.query('SELECT oid, gid, gtype FROM public.gurukul_offerings ORDER BY oid ASC');
    console.log("In findAllGurukulOfferings");
    return result.rows;
  } catch (error) {
    console.error('Error in findAllGurukulOfferings:', error);
    throw new Error('Could not retrieve gurukul offerings');
  }
};

/**
 * Retrieves a single gurukul offering by its ID from the database.
 * @param oid The ID of the gurukul offering.
 * @returns A Promise that resolves to the GurukulOffering object if found, otherwise undefined.
 */
export const findGurukulOfferingById = async (oid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query('SELECT oid, gid, gtype FROM public.gurukul_offerings WHERE oid = $1', [oid]);
    console.log("In findGurukulOfferingById ");
    return result.rows[0];
  } catch (error) {
    console.error(`Error in findGurukulOfferingById (OID: ${oid}):`, error);
    throw new Error(`Could not retrieve gurukul offering with ID ${oid}`);
  }
};

export const getGurukulOfferingsByGid = async (gid: number) => {
  try{
  const query = 'SELECT * FROM gurukul_offerings WHERE gid = $1';
  const result = await pool.query(query, [gid]); // adjust if using ORM
  return result.rows;
  }
  catch(error) {
    console.error(`Error in getGurukulOfferingsByGid (GID: ${gid}):`, error);
    throw new Error(`Could not retrieve gurukul offering with ID ${gid}`);
  }
};
/**
 * Creates a new gurukul offering in the database.
 * @param gid The Gurukul ID it belongs to.
 * @param gtype The type of offering (G1, G2, G3, G4).
 * @returns A Promise that resolves to the newly created GurukulOffering object if successful, or throws an error.
 */
export const createNewGurukulOffering = async (gid: number, gtype: string): Promise<any | null | undefined> => {
  // Validate gtype against the CHECK constraint
  const validGTypes = ['G1', 'G2', 'G3', 'G4'];
  if (!validGTypes.includes(gtype)) {
    return undefined; // Indicate invalid gtype
  }

  try {
    // Check if Gurukul exists before creating the offering (to enforce FK constraint logic)
    const gurukulExists = await findGurukulById(gid);
    if (!gurukulExists) {
      return null; // Indicate Gurukul does not exist
    }
    // Check for duplicate offering (same gid and gtype)
    const existingOffering = await pool.query(
      'SELECT oid FROM public.gurukul_offerings WHERE gid = $1 AND gtype = $2',
      [gid, gtype]
    );
    if (existingOffering.rowCount != null && existingOffering.rowCount > 0) {
      return false; // Indicate duplicate offering
    }

    const result = await pool.query(
      'INSERT INTO public.gurukul_offerings (gid, gtype) VALUES ($1, $2) RETURNING oid, gid, gtype',
      [gid, gtype]
    );
    console.log("In createNewGurukulOffering ");
    return result.rows[0];
  } catch (error) {
    console.error('Error in createNewGurukulOffering:', error);
    throw new Error('Could not create gurukul offering');
  }
};

/**
 * Updates an existing gurukul offering.
 * @param oid The ID of the gurukul offering to update.
 * @param gid The new Gurukul ID it belongs to.
 * @param gtype The new type of offering.
 * @returns A Promise that resolves to the updated GurukulOffering object if successful, or throws an error.
 */
export const updateExistingGurukulOffering = async (oid: number, gid: number, gtype: string): Promise<any | null | undefined | false> => {
  const validGTypes = ['G1', 'G2', 'G3', 'G4'];
  if (!validGTypes.includes(gtype)) {
    return undefined; // Indicate invalid gtype
  }

  try {
    // Check if Gurukul exists
    const gurukulExists = await findGurukulById(gid);
    if (!gurukulExists) {
      return null; // Indicate Gurukul does not exist
    }
    // Check for duplicate *for another offering* (if changing gtype or gid)
    const existingOfferingForOtherId = await pool.query(
      'SELECT oid FROM public.gurukul_offerings WHERE gid = $1 AND gtype = $2 AND oid != $3',
      [gid, gtype, oid]
    );
    if (existingOfferingForOtherId.rowCount !=null && existingOfferingForOtherId.rowCount > 0) {
      return false; // Indicate this update would create a duplicate with another existing offering
    }

    const result = await pool.query(
      'UPDATE public.gurukul_offerings SET gid = $1, gtype = $2 WHERE oid = $3 RETURNING oid, gid, gtype',
      [gid, gtype, oid]
    );
    console.log("In updateExistingGurukulOffering");
    return result.rows[0]; // Returns undefined if no row was updated
  } catch (error) {
    console.error(`Error in updateExistingGurukulOffering (OID: ${oid}):`, error);
    throw new Error(`Could not update gurukul offering with ID ${oid}`);
  }
};

/**
 * Deletes a gurukul offering from the database.
 * @param oid The ID of the gurukul offering to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if offering not found.
 */
export const deleteGurukulOfferingById = async (oid: number): Promise<boolean> => {
  try {
    const result = await pool.query('DELETE FROM public.gurukul_offerings WHERE oid = $1 RETURNING oid', [oid]);
    console.log("In deleteGurukulOfferingById ");
    return (result.rowCount ?? 0) > 0; // Safely use rowCount
  } catch (error) {
    console.error(`Error in deleteGurukulOfferingById (OID: ${oid}):`, error);
    throw new Error(`Could not delete gurukul offering with ID ${oid}`);
  }
};

