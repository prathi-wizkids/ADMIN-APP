// services/teacherDirectService.ts - Direct operations on teachmate.teachers

import pool from '../utils/db';
import bcrypt from 'bcryptjs';
import { findSubjectById } from './subjectService'; // Reusing existing subject validation
import { PoolClient } from 'pg'; // For transactional consistency

/**
 * Assigns one or more subjects to a teacher directly in teachmate.teacher_assignments.
 * This function clears existing assignments and sets new ones.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @param subjectIds An array of subject IDs to assign.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns A Promise that resolves to true if assignments are successful.
 */
const assignSubjectsToTeacherDirect = async (teachid: number, subjectIds: number[], queryClient: PoolClient): Promise<boolean> => {
  try {
    // 1. Verify teacher exists (already done by calling service, but good to have a check)
    const teacher = await queryClient.query('SELECT teachid FROM teachmate.teachers WHERE teachid = $1', [teachid]);
    if (teacher.rowCount === 0) {
      console.warn(`Teacher with TEACHID ${teachid} not found. Cannot assign subjects.`);
      return false;
    }

    // 2. Clear existing assignments for this teacher
    await queryClient.query('DELETE FROM teachmate.teacher_assignments WHERE teacher_id = $1', [teachid]);

    // 3. Assign new subjects assumption here is that UI sends changed information.
    for (const subid of subjectIds) {
      const subjectExists = await findSubjectById(subid); // This still uses global 'pool' for subject validation
      if (!subjectExists) {
        console.warn(`Subject with ID ${subid} not found during assignment to teacher ${teachid}. Skipping.`);
      } else {
        await queryClient.query(
          'INSERT INTO teachmate.teacher_assignments (teacher_id, sub_id, isapprover) VALUES ($1, $2, FALSE)',
          [teachid, subid]
        );
      }
    }
    return true;
  } catch (error) {
    console.error(`Error in assignSubjectsToTeacherDirect (Teacher ID: ${teachid}, Subjects: ${subjectIds}):`, error);
    throw new Error('Could not assign subjects to teacher directly');
  }
};

/**
 * Retrieves all subjects assigned to a specific teacher.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @returns A Promise that resolves to an array of Subject objects assigned to the teacher.
 */
const findSubjectsAssignedToTeacherDirect = async (teachid: number): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT
          s.subid,
          s.subname,
          s.level,
          s.image_url
      FROM
          teachmate.subjects s
      JOIN
          teachmate.teacher_assignments ts ON s.subid = ts.sub_id
      WHERE
          ts.teacher_id = $1
      ORDER BY
          s.subname ASC`,
      [teachid]
    );
    return result.rows;
  } catch (error) {
    console.error(`Error in findSubjectsAssignedToTeacherDirect (Teacher ID: ${teachid}):`, error);
    throw new Error(`Could not retrieve subjects for teacher ID ${teachid}`);
  }
};


/**
 * Creates a new teacher directly in teachmate.teachers.
 * @param name The name of the teacher.
 * @param email The email of the teacher (must be unique).
 * @param subjectIds Optional: An array of subject IDs to assign.
 * @returns A Promise that resolves to the newly created Teacher object.
 * Returns false if a teacher with the same email already exists.
 */
export const createTeacherDirect = async (
    name: string,
    email: string,
    subjectIds?: number[]
): Promise<any | false> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for duplicate email in teachmate.teachers
    const existingTeacher = await client.query('SELECT teachid FROM teachmate.teachers WHERE email = $1', [email]);
    if (existingTeacher.rowCount != null && existingTeacher.rowCount > 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const defaultPassword = 'password123'; // Assuming a default password for direct creation
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const teacherResult = await client.query(
      'INSERT INTO teachmate.teachers (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING teachid, name, email, created_at',
      [name, email, passwordHash]
    );
    const newTeacher = teacherResult.rows[0];
    const newTeachId = newTeacher.teachid;

    if (subjectIds && subjectIds.length > 0) {
        await assignSubjectsToTeacherDirect(newTeachId, subjectIds, client);
    }

    await client.query('COMMIT');
    // Re-fetch to include assigned subjects
    return await findTeacherDirectById(newTeachId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createTeacherDirect:', error);
    throw new Error('Could not create teacher directly');
  } finally {
    client.release();
  }
};

/**
 * Updates an existing teacher directly in teachmate.teachers.
 * @param teachid The ID of the teacher to update.
 * @param teacherData Object containing optional name, email, and subjectIds.
 * @returns A Promise that resolves to the updated Teacher object if successful, undefined if not found.
 * Returns false if the update would create a duplicate email.
 * Returns '404' string if teacher not found.
 */
export const updateTeacherDirect = async (
    teachid: number,
    teacherData: { name?: string; email?: string; subjectIds?: number[] }
): Promise<any | false | '404'> => {
  const { name, email, subjectIds } = teacherData;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentTeacherResult = await client.query('SELECT teachid, name, email FROM teachmate.teachers WHERE teachid = $1', [teachid]);
    const currentTeacher = currentTeacherResult.rows[0];
    if (!currentTeacher) {
      await client.query('ROLLBACK');
      return '404'; // Teacher not found
    }

    const targetEmail = email !== undefined ? email : currentTeacher.email;

    if (email !== undefined && email !== currentTeacher.email) {
      const existingDuplicateTeacher = await client.query(
        'SELECT teachid FROM teachmate.teachers WHERE email = $1 AND teachid != $2',
        [targetEmail, teachid]
      );
      if (existingDuplicateTeacher.rowCount != null && existingDuplicateTeacher.rowCount > 0) {
        await client.query('ROLLBACK');
        return false; // Email already exists for another teacher
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email);
    }

    if (fields.length > 0) {
        values.push(teachid);
        const updateQuery = `UPDATE teachmate.teachers SET ${fields.join(', ')} WHERE teachid = $${paramIndex} RETURNING teachid`;
        const updateResult = await client.query(updateQuery, values);
        if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return '404';
        }
    }
    
    if (subjectIds !== undefined) {
        await assignSubjectsToTeacherDirect(teachid, subjectIds, client);
    }

    await client.query('COMMIT');
    // Re-fetch to include assigned subjects
    return await findTeacherDirectById(teachid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in updateTeacherDirect (Teacher ID: ${teachid}):`, error);
    throw new Error(`Could not update teacher with ID ${teachid} directly`);
  } finally {
    client.release();
  }
};

/**
 * Retrieves a single teacher by their ID from teachmate.teachers.
 * @param teachid The ID of the teacher.
 * @returns A Promise that resolves to the Teacher object if found, otherwise undefined.
 */
export const findTeacherDirectById = async (teachid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query(
      `SELECT teachid, name, email, last_login, created_at FROM teachmate.teachers WHERE teachid = $1`,
      [teachid]
    );
    const teacher = result.rows[0];

    if (teacher) {
        teacher.assigned_subjects = await findSubjectsAssignedToTeacherDirect(teacher.teachid);
    }
    return teacher;
  } catch (error) {
    console.error(`Error in findTeacherDirectById (Teacher ID: ${teachid}):`, error);
    throw new Error(`Could not retrieve teacher with ID ${teachid} directly`);
  }
};

/**
 * Retrieves all teachers from teachmate.teachers.
 * @returns A Promise that resolves to an array of Teacher objects.
 */
export const findAllTeachersDirect = async (): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT teachid, name, email, last_login, created_at FROM teachmate.teachers ORDER BY name ASC`
    );
    const teachers = result.rows;

    const enhancedTeachers = [];
    for (const teacher of teachers) {
      teacher.assigned_subjects = await findSubjectsAssignedToTeacherDirect(teacher.teachid);
      enhancedTeachers.push(teacher);
    }
    return enhancedTeachers;
  } catch (error) {
    console.error('Error in findAllTeachersDirect:', error);
    throw new Error('Could not retrieve teachers directly');
  }
};
