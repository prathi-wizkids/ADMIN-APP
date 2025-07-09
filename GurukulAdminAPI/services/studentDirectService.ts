// services/studentDirectService.ts - Direct operations on studentmate.students

import pool from '../utils/db';
import bcrypt from 'bcryptjs';
import { findGurukulById } from './gurukulService'; // Reusing existing gurukul validation
import { findMilestoneById } from './milestoneService'; // Reusing existing milestone validation
import { PoolClient } from 'pg'; // For transactional consistency

export const assignLessonsToStudentByLevel = async (studentId: number, studentLevel: string): Promise<{ message: string, newSlogsCount: number }> => {
    try {
        console.log(`Attempting to assign lessons to student ID: ${studentId} at level: ${studentLevel}`);

        // 1. Get all lessons that are status=2 and match the student's level,
        //    along with their associated journey IDs.
        const getEligibleLessonsQuery = `
            SELECT l.lid, l.lname, s.subid, s.level, j.jid
            FROM teachmate.lessons l
            JOIN teachmate.topics t ON l.tid = t.tid
            JOIN teachmate.subjects s ON t.subid = s.subid
            JOIN teachmate.journey j ON l.lid = j.lesson_id
            WHERE l.status = 2 AND s.level = $1;
        `;
        const eligibleLessonsResult = await pool.query(getEligibleLessonsQuery, [studentLevel]);

        if (eligibleLessonsResult.rowCount === 0) {
            console.log(`No eligible lessons (status=2, level=${studentLevel}) found for student ID: ${studentId}.`);
            return { message: `No eligible lessons found for student at level ${studentLevel}.`, newSlogsCount: 0 };
        }

        console.log(`${eligibleLessonsResult.rowCount} eligible lessons found for student ID: ${studentId}.`);

        // 2. Insert slog entries for each eligible lesson's journey ID against the student ID.
        //    Only insert if the slog entry does not already exist.
        const insertSlogQuery = `
            INSERT INTO studentmate.slog (sid, jid, starttime, status)
            VALUES ($1, $2, NOW(), 'In_progress')
        `;
        const checkSlogExistsQuery = `
            SELECT 1 FROM studentmate.slog WHERE sid = $1 AND jid = $2
        `;
        let newSlogsCreatedCount = 0;

        for (const lesson of eligibleLessonsResult.rows) {
            const { jid, lid, lname } = lesson; // Extract jid and other lesson info for logging

            // Check if a slog entry already exists for this student and journey
            const existsResult = await pool.query(checkSlogExistsQuery, [studentId, jid]);
            
            if (existsResult.rowCount === 0) {
                // If it doesn't exist, insert a new slog entry
                await pool.query(insertSlogQuery, [studentId, jid]);
                console.log(`Created new slog for student ID: ${studentId}, journey ID: ${jid} (Lesson: ${lname}, ID: ${lid}).`);
                newSlogsCreatedCount++;
            } else {
                console.log(`Slog already exists for student ID: ${studentId} and journey ID: ${jid} (Lesson: ${lname}, ID: ${lid}). Skipping insertion.`);
            }
        }

        console.log(`Finished assigning lessons. Total new slogs created: ${newSlogsCreatedCount}.`);
        return { message: `Successfully created ${newSlogsCreatedCount} new slogs for student ID ${studentId} at level ${studentLevel}.`, newSlogsCount: newSlogsCreatedCount };

    } catch (err) {
        console.error(`Error in assignLessonsToStudentByLevel for student ID ${studentId}, level ${studentLevel}:`, err);
        // Re-throw the error to be handled by the calling API endpoint or error middleware
        throw err;
    }
};


/**
 * Assigns a gurukul to a student directly in studentmate.sgurukul.
 * This function clears existing assignments and sets new ones.
 * @param sid The studentmate.students.sid of the student.
 * @param gurukulId The ID of the gurukul to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
const assignGurukulToStudentDirect = async (sid: number, gurukulId: number | null, queryClient: PoolClient): Promise<boolean> => {
    try {
        const student = await queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign gurukul.`);
            return false;
        }

        await queryClient.query('DELETE FROM studentmate.sgurukul WHERE sid = $1', [sid]);

        if (gurukulId !== null) {
            const gurukulExists = await findGurukulById(gurukulId); // This uses global 'pool'
            if (!gurukulExists) {
                console.warn(`Gurukul with ID ${gurukulId} not found during assignment to student ${sid}. Skipping.`);
                return false;
            }
            await queryClient.query(
                'INSERT INTO studentmate.sgurukul (sid, gid, status, starttime) VALUES ($1, $2, $3, NOW())',
                [sid, gurukulId, 'Started']
            );
        }
        return true;
    } catch (error) {
        console.error(`Error in assignGurukulToStudentDirect (Student ID: ${sid}, Gurukul ID: ${gurukulId}):`, error);
        throw new Error('Could not assign gurukul to student directly');
    }
};

/**
 * Assigns a milestone to a student directly in studentmate.smilestones.
 * This function clears existing assignments and sets new ones.
 * @param sid The studentmate.students.sid of the student.
 * @param milestoneId The ID of the milestone to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
const assignMilestoneToStudentDirect = async (sid: number, milestoneId: number | null, queryClient: PoolClient): Promise<boolean> => {
    try {
        const student = await queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign milestone.`);
            return false;
        }

        await queryClient.query('DELETE FROM studentmate.smilestones WHERE sid = $1', [sid]);

        if (milestoneId !== null) {
            const milestoneExists = await findMilestoneById(milestoneId); // This uses global 'pool'
            if (!milestoneExists) {
                console.warn(`Milestone with ID ${milestoneId} not found during assignment to student ${sid}. Skipping.`);
                return false;
            }
            await queryClient.query(
                'INSERT INTO studentmate.smilestones (sid, mid, status, starttime) VALUES ($1, $2, $3, NOW())',
                [sid, milestoneId, 'Started']
            );
        }
        return true;
    } catch (error) {
        console.error(`Error in assignMilestoneToStudentDirect (Student ID: ${sid}, Milestone ID: ${milestoneId}):`, error);
        throw new Error('Could not assign milestone to student directly');
    }
};

/**
 * Retrieves gurukul details assigned to a specific student.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Gurukul objects assigned to the student.
 */
const findGurukulsAssignedToStudentDirect = async (sid: number): Promise<any[]> => {
    try {
        const result = await pool.query(
            `SELECT
                g.gid,
                g.gname,
                sg.starttime,
                sg.endtime,
                sg.status
            FROM
                public.gurukul g
            JOIN
                studentmate.sgurukul sg ON g.gid = sg.gid
            WHERE
                sg.sid = $1`,
            [sid]
        );
        return result.rows;
    } catch (error) {
        console.error(`Error in findGurukulsAssignedToStudentDirect (Student ID: ${sid}):`, error);
        throw new Error(`Could not retrieve gurukuls for student ID ${sid}`);
    }
};

/**
 * Retrieves milestone details assigned to a specific student.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Milestone objects assigned to the student.
 */
const findMilestonesAssignedToStudentDirect = async (sid: number): Promise<any[]> => {
    try {
        const result = await pool.query(
            `SELECT
        m.mid,
        m.class,
        m.level,
        sm.starttime,
        sm.endtime,
        sm.status,
        sm.score
      FROM
        public.milestones m
      JOIN
        studentmate.smilestones sm ON m.mid = sm.mid
      WHERE
        sm.sid = $1`,
            [sid]
        );
        return result.rows;
    } catch (error) {
        console.error(`Error in findMilestonesAssignedToStudentDirect (Student ID: ${sid}):`, error);
        throw new Error('Could not retrieve milestones for student ID ${sid}');
    }
};


/**
 * Creates a new student directly in studentmate.students.
 * @param sname The name of the student.
 * @param email The email of the student (must be unique).
 * @param gurukulId Optional: The ID of the gurukul to assign the student to.
 * @param milestoneId Optional: The ID of the milestone to assign the student to.
 * @returns A Promise that resolves to the newly created Student object.
 * Returns false if a student with the same email already exists.
 */
export const createStudentDirect = async (
    sname: string,
    email: string,
    gurukulId?: number | null,
    milestoneId?: number | null
): Promise<any | false> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for duplicate email in studentmate.students
    const existingStudent = await client.query('SELECT sid FROM studentmate.students WHERE email = $1', [email]);
    if (existingStudent.rowCount != null && existingStudent.rowCount > 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const defaultPassword = 'password123'; // Assuming a default password for direct creation
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const studentResult = await client.query(
      'INSERT INTO studentmate.students (sname, email, password_hash) VALUES ($1, $2, $3) RETURNING sid, sname, email',
      [sname, email, passwordHash]
    );
    const newStudent = studentResult.rows[0];
    const newSid = newStudent.sid;

    if (gurukulId !== null && gurukulId !== undefined) {
        await assignGurukulToStudentDirect(newSid, gurukulId, client);
    }
    if (milestoneId !== null && milestoneId !== undefined) {
        await assignMilestoneToStudentDirect(newSid, milestoneId, client);
        // After assigning milestone, attempt to assign lessons based on the milestone's level
        const assignedMilestone = await findMilestoneById(milestoneId);
        if (assignedMilestone && assignedMilestone.level) {
            console.log(`New student ${newSid} assigned milestone ${milestoneId} with level ${assignedMilestone.level}. Attempting to assign lessons.`);
            await assignLessonsToStudentByLevel(newSid, assignedMilestone.level);
        } else {
            console.log(`New student ${newSid} assigned milestone ${milestoneId}, but could not retrieve level or level is missing. Skipping lesson assignment.`);
        }
    }

    await client.query('COMMIT');
    // Re-fetch to include assigned gurukuls and milestones
    return await findStudentDirectById(newSid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createStudentDirect:', error);
    throw new Error('Could not create student directly');
  } finally {
    client.release();
  }
};

/**
 * Updates an existing student directly in studentmate.students.
 * @param sid The ID of the student to update.
 * @param studentData Object containing optional sname, email, gurukulId, and milestoneId.
 * @returns A Promise that resolves to the updated Student object if successful, undefined if not found.
 * Returns false if the update would create a duplicate email.
 * Returns '404' string if student not found.
 */
export const updateStudentDirect = async (
    sid: number,
    studentData: { sname?: string; email?: string; gurukulId?: number | null; milestoneId?: number | null }
): Promise<any | false | '404'> => {
  const { sname, email, gurukulId, milestoneId } = studentData;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentStudentResult = await client.query('SELECT sid, sname, email FROM studentmate.students WHERE sid = $1', [sid]);
    const currentStudent = currentStudentResult.rows[0];
    if (!currentStudent) {
      await client.query('ROLLBACK');
      return '404'; // Student not found
    }

    const targetEmail = email !== undefined ? email : currentStudent.email;

    if (email !== undefined && email !== currentStudent.email) {
      const existingDuplicateStudent = await client.query(
        'SELECT sid FROM studentmate.students WHERE email = $1 AND sid != $2',
        [targetEmail, sid]
      );
      if (existingDuplicateStudent.rowCount != null && existingDuplicateStudent.rowCount > 0) {
        await client.query('ROLLBACK');
        return false; // Email already exists for another student
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (sname !== undefined) {
        fields.push(`sname = $${paramIndex++}`);
        values.push(sname);
    }
    if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email);
    }

    if (fields.length > 0) {
        values.push(sid);
        const updateQuery = `UPDATE studentmate.students SET ${fields.join(', ')} WHERE sid = $${paramIndex} RETURNING sid`;
        const updateResult = await client.query(updateQuery, values);
        if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return '404';
        }
    }
    
    if (gurukulId !== undefined) {
        await assignGurukulToStudentDirect(sid, gurukulId, client);
    }
    if (milestoneId !== null && milestoneId !== undefined) {
        await assignMilestoneToStudentDirect(sid, milestoneId, client);
        // After assigning milestone, attempt to assign lessons based on the milestone's level
        const assignedMilestone = await findMilestoneById(milestoneId);
        if (assignedMilestone && assignedMilestone.level) {
            console.log(`Student ${sid} updated with milestone ${milestoneId} (level: ${assignedMilestone.level}). Attempting to assign lessons.`);
            await assignLessonsToStudentByLevel(sid, assignedMilestone.level);
        } else {
            console.log(`Student ${sid} updated with milestone ${milestoneId}, but could not retrieve level or level is missing. Skipping lesson assignment.`);
        }
        
    }

    await client.query('COMMIT');
    // Re-fetch to include assigned gurukuls and milestones
    return await findStudentDirectById(sid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in updateStudentDirect (Student ID: ${sid}):`, error);
    throw new Error(`Could not update student with ID ${sid} directly`);
  } finally {
    client.release();
  }
};

/**
 * Retrieves a single student by their ID from studentmate.students.
 * @param sid The ID of the student.
 * @returns A Promise that resolves to the Student object if found, otherwise undefined.
 */
export const findStudentDirectById = async (sid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query(
      `SELECT sid, sname, email FROM studentmate.students WHERE sid = $1`,
      [sid]
    );
    const student = result.rows[0];

    if (student) {
        student.assigned_gurukuls = await findGurukulsAssignedToStudentDirect(student.sid);
        student.assigned_milestones = await findMilestonesAssignedToStudentDirect(student.sid);
    }
    return student;
  } catch (error) {
    console.error(`Error in findStudentDirectById (Student ID: ${sid}):`, error);
    throw new Error(`Could not retrieve student with ID ${sid} directly`);
  }
};

/**
 * Retrieves all students from studentmate.students.
 * @returns A Promise that resolves to an array of Student objects.
 */
export const findAllStudentsDirect = async (): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT sid, sname, email FROM studentmate.students ORDER BY sname ASC`
    );
    const students = result.rows;

    const enhancedStudents = [];
    for (const student of students) {
      student.assigned_gurukuls = await findGurukulsAssignedToStudentDirect(student.sid);
      student.assigned_milestones = await findMilestonesAssignedToStudentDirect(student.sid);
      // ### CHANGE END: Fetch assigned milestones
      enhancedStudents.push(student);
    }
    return enhancedStudents;
  } catch (error) {
    console.error('Error in findAllStudentsDirect:', error);
    throw new Error('Could not retrieve students directly');
  }
};
