// services/topicService.ts - Handles the core business logic for Topics
// Interacts with the teachmate.topics table and uses corrected column names.
// Corrected: Explicit null checks for rowCount and added image_url to create and update.

import pool from '../utils/db'; // Import the database connection pool
import { findSubjectById } from './subjectService'; // Import to validate subid

// --- Topic Service Functions ---

/**
 * Retrieves all topics from the database.
 * @returns A Promise that resolves to an array of Topic objects.
 */
export const findAllTopics = async (): Promise<any[]> => {
  try {
    // Corrected table and column names
    const result = await pool.query('SELECT tid, tname, subid, image_url FROM teachmate.topics ORDER BY tid ASC');
    return result.rows;
  } catch (error) {
    console.error('Error in findAllTopics:', error);
    throw new Error('Could not retrieve topics');
  }
};

/**
 * Retrieves a single topic by its ID from the database.
 * @param tid The ID of the topic.
 * @returns A Promise that resolves to the Topic object if found, otherwise undefined.
 */
export const findTopicById = async (tid: number): Promise<any | undefined> => {
  try {
    // Corrected table and column names
    const result = await pool.query('SELECT tid, tname, subid, image_url FROM teachmate.topics WHERE tid = $1', [tid]);
    return result.rows[0]; // Returns undefined if no row is found
  } catch (error) {
    console.error(`Error in findTopicById (TID: ${tid}):`, error);
    throw new Error(`Could not retrieve topic with ID ${tid}`);
  }
};

/**
 * Retrieves topics by their subject ID from the database.
 * @param subid The ID of the parent subject.
 * @returns A Promise that resolves to an array of Topic objects.
 */
export const findTopicsBySubject = async (subid: number): Promise<any[]> => {
  try {
    // Corrected table and column names
    const result = await pool.query('SELECT tid, tname, subid, image_url FROM teachmate.topics WHERE subid = $1 ORDER BY tname ASC', [subid]);
    return result.rows;
  } catch (error) {
    console.error(`Error in findTopicsBySubject (SUBID: ${subid}):`, error);
    throw new Error(`Could not retrieve topics for subject ID ${subid}`);
  }
};


/**
 * Creates a new topic in the database.
 * Validates that the provided 'subid' exists and prevents duplicate topic names for the same subject.
 * @param tname The name of the topic.
 * @param subid The Subject ID it belongs to.
 * @param image_url Optional URL for the topic image.
 * @returns A Promise that resolves to the newly created Topic object.
 * Returns null if subject (subid) does not exist.
 * Returns false if a duplicate topic name already exists for this subject.
 */
export const createNewTopic = async (tname: string, subid: number, image_url?: string): Promise<any | null | false> => {
  try {
    // 1. Validate that the subid (subject) exists
    const subjectExists = await findSubjectById(subid); // Corrected to use subid
    if (!subjectExists) {
      return null; // Indicate that the foreign key (subid) is invalid
    }

    // 2. Check for duplicate topic name for this specific subject (subid)
    const existingTopic = await pool.query(
      'SELECT tid FROM teachmate.topics WHERE subid = $1 AND tname = $2', // Corrected table and column names
      [subid, tname]
    );
    if (existingTopic.rowCount != null && existingTopic.rowCount > 0) { // Added null check
      return false; // Indicate duplicate topic for this subject
    }

    // Note: Assuming 'tid' is handled by an IDENTITY column or SERIAL in your database.
    // image_url is now included in the insert.
    const result = await pool.query(
      'INSERT INTO teachmate.topics (tname, subid, image_url) VALUES ($1, $2, $3) RETURNING tid, tname, subid, image_url', // Corrected table and column names, added image_url
      [tname, subid, image_url]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in createNewTopic:', error);
    throw new Error('Could not create topic');
  }
};

/**
 * Updates an existing topic in the database.
 * Validates that the provided 'subid' exists (if changed) and prevents updates that would create a duplicate.
 * @param tid The ID of the topic to update.
 * @param topicData Object containing optional tname, subid, and image_url.
 * @returns A Promise that resolves to the updated Topic object if successful, otherwise undefined (if not found).
 * Returns null if subject (subid) does not exist (if subid is changed).
 * Returns false if the update would create a duplicate topic name for the target subject.
 * Returns '404' string if topic itself is not found.
 */
export const updateExistingTopic = async (tid: number, topicData: { tname?: string; subid?: number; image_url?: string }): Promise<any | null | false | '404'> => {
  const { tname, subid, image_url } = topicData;
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Fetch current topic data for comparison
  const currentTopic = await findTopicById(tid);
  if (!currentTopic) {
    return '404'; // Topic not found
  }

  const targetTname = tname !== undefined ? tname : currentTopic.tname;
  const targetSid = subid !== undefined ? subid : currentTopic.subid; // Corrected to subid

  // Validate that the new/updated subid (subject) exists if provided
  if (subid !== undefined) {
    const subjectExists = await findSubjectById(subid); // Corrected to use subid
    if (!subjectExists) {
      return null; // Indicate that the foreign key (subid) is invalid
    }
  }

  // Check for duplicate topic name for the target subject (excluding self)
  const existingDuplicateTopic = await pool.query(
    'SELECT tid FROM teachmate.topics WHERE subid = $1 AND tname = $2 AND tid != $3', // Corrected table and column names
    [targetSid, targetTname, tid]
  );
  if (existingDuplicateTopic.rowCount != null && existingDuplicateTopic.rowCount > 0) { // Added null check
    return false; // This update would create a duplicate topic for this subject
  }

  if (tname !== undefined) {
    fields.push(`tname = $${paramIndex++}`);
    values.push(tname);
  }
  if (subid !== undefined) {
    fields.push(`subid = $${paramIndex++}`); // Corrected to subid
    values.push(subid);
  }
  if (image_url !== undefined) { // Added image_url update
    fields.push(`image_url = $${paramIndex++}`);
    values.push(image_url);
  }

  if (fields.length === 0) {
    return currentTopic; // No fields to update
  }

  values.push(tid); // Add tid for the WHERE clause
  const query = `UPDATE teachmate.topics SET ${fields.join(', ')} WHERE tid = $${paramIndex} RETURNING tid, tname, subid, image_url`; // Corrected table and column names

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Returns undefined if no row was updated (should be caught by 404 check above)
  } catch (error) {
    console.error(`Error in updateExistingTopic (TID: ${tid}):`, error);
    throw new Error(`Could not update topic with ID ${tid}`);
  }
};

/**
 * Deletes a topic from the database.
 * @param tid The ID of the topic to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if topic not found.
 */
export const deleteTopicById = async (tid: number): Promise<boolean> => {
  try {
    // Corrected table name
    const result = await pool.query('DELETE FROM teachmate.topics WHERE tid = $1 RETURNING tid', [tid]);
    return (result.rowCount != null && result.rowCount > 0); // Corrected to use explicit null check
  } catch (error) {
    console.error(`Error in deleteTopicById (TID: ${tid}):`, error);
    throw new Error(`Could not delete topic with ID ${tid}`);
  }
};

