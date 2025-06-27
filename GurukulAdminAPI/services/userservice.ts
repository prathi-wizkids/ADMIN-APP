// services/userService.ts - Targeted Type Fixes

import pool from '../utils/db';
import { findSubjectById } from './subjectService';
import bcrypt from 'bcryptjs';
import { findGurukulById } from './gurukulService';
import { findMilestoneById } from './milestoneService';

// --- Helper to get role-specific ID and link from public.users.userid ---
const getRoleSpecificIds = async (userid: number, role: string) => {
    let roleSpecificId: number | null = null;
    let userLinkData = null; // Contains the teachid or sid AND the user_id_link
    if (role === 'teacher') {
        const result = await pool.query('SELECT teachid, user_id_link FROM teachmate.teachers WHERE user_id_link = $1', [userid]);
        userLinkData = result.rows[0];
        if (userLinkData) {
            roleSpecificId = userLinkData.teachid;
        }
    } else if (role === 'student') {
        const result = await pool.query('SELECT sid, user_id_link FROM studentmate.students WHERE user_id_link = $1', [userid]);
        userLinkData = result.rows[0];
        if (userLinkData) {
            roleSpecificId = userLinkData.sid;
        }
    }
    return { roleSpecificId, userLinkData };
};


// --- User Service Functions ---

/**
 * Retrieves all users from the public.users table.
 * Enhances results with role-specific data (teachid/sid, assigned subjects/gurukuls/milestones).
 * Finds role-specific data by looking up the user_role_link and role type.
 * @param role Optional role to filter by.
 * @returns An array of User objects with enhanced details.
 */
export const findAllUsers = async (role?: string): Promise<any[]> => {
  try {
    let queryText = `
      SELECT
          u.userid,
          u.username,
          u.email,
          u.role,
          u.isdeleted,
          u.created_at,
          u.user_role_link
      FROM
          public.users u
      WHERE
          u.isdeleted = FALSE
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (role) {
      queryText += ` AND u.role = $${paramIndex++}`;
      queryParams.push(role);
    }

    queryText += ` ORDER BY u.username ASC`;

    const result = await pool.query(queryText, queryParams);
    const users = result.rows;

    const enhancedUsers = [];
    for (const user of users) {
      if (user.role === 'teacher' && user.user_role_link) {
        const teacherResult = await pool.query('SELECT teachid, last_login FROM teachmate.teachers WHERE teachid = $1', [user.user_role_link]);
        if (teacherResult.rows[0]) {
            user.teachid = teacherResult.rows[0].teachid;
            user.last_login = teacherResult.rows[0].last_login;
            user.assigned_subjects = await findSubjectsAssignedToTeacher(user.teachid);
        }
      } else if (user.role === 'student' && user.user_role_link) {
        const studentResult = await pool.query('SELECT sid FROM studentmate.students WHERE sid = $1', [user.user_role_link]);
        if (studentResult.rows[0]) {
            user.sid = studentResult.rows[0].sid;
            user.assigned_gurukuls = await findGurukulsAssignedToStudent(user.sid);
            user.assigned_milestones = await findMilestonesAssignedToStudent(user.sid);
        }
      }
      enhancedUsers.push(user);
    }

    return enhancedUsers;
  } catch (error) {
    console.error('Error in findAllUsers:', error);
    throw new Error('Could not retrieve users');
  }
};

/**
 * Retrieves a single user by their ID from public.users, enhancing with role-specific data.
 * @param userid The public.users.userid.
 * @returns A User object with full details, or undefined.
 */
export const findUserById = async (userid: number): Promise<any | undefined> => {
  try {
    const result = await pool.query(
      `SELECT userid, username, email, role, isdeleted, created_at, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE`,
      [userid]
    );
    const user = result.rows[0];

    if (user) {
        if (user.role === 'teacher' && user.user_role_link) {
            const teacherResult = await pool.query('SELECT teachid, last_login FROM teachmate.teachers WHERE teachid = $1', [user.user_role_link]);
            if (teacherResult.rows[0]) {
                user.teachid = teacherResult.rows[0].teachid;
                user.last_login = teacherResult.rows[0].last_login;
                user.assigned_subjects = await findSubjectsAssignedToTeacher(user.teachid);
            }
        } else if (user.role === 'student' && user.user_role_link) {
            const studentResult = await pool.query('SELECT sid FROM studentmate.students WHERE sid = $1', [user.user_role_link]);
            if (studentResult.rows[0]) {
                user.sid = studentResult.rows[0].sid;
                user.assigned_gurukuls = await findGurukulsAssignedToStudent(user.sid);
                user.assigned_milestones = await findMilestonesAssignedToStudent(user.sid);
            }
        }
    }
    return user;
  } catch (error) {
    console.error(`Error in findUserById (User ID: ${userid}):`, error);
    throw new Error(`Could not retrieve user with ID ${userid}`);
  }
};

/**
 * Creates a new user by first creating the role-specific record (teacher/student),
 * then creating the public.users record and linking to the role-specific ID.
 * @param username The username of the user.
 * @param email The email of the user (must be unique across all relevant tables).
 * @param role The role of the user.
 * @param gurukulId Optional: The ID of the gurukul to assign the student to.
 * @param milestoneId Optional: The ID of the milestone to assign the student to.
 * @param subjectIds Optional: An array of subject IDs to assign to a teacher.
 * @returns A Promise that resolves to the newly created User object (from public.users) with enhanced details.
 * Returns false if a user with the same email already exists in any relevant table.
 */
export const createNewUser = async (
    username: string,
    email: string,
    role: string,
    gurukulId?: number | null,
    milestoneId?: number | null,
    subjectIds?: number[]
): Promise<any | false> => {
  const client = await pool.connect(); // Get a PoolClient for the transaction
  try {
    await client.query('BEGIN'); // Start transaction

    // --- Critical: Check for duplicate emails across all relevant tables first ---
    const checkEmail = async (tbl: string, emailVal: string, idCol: string, whereCol: string = 'email') => {
        const res = await client.query(`SELECT ${idCol} FROM ${tbl} WHERE ${whereCol} = $1`, [emailVal]);
        return res.rowCount && res.rowCount > 0;
    };

    if (await checkEmail('public.users', email, 'userid', 'email')) {
        await client.query('ROLLBACK');
        return false; // Email already exists in public.users
    }
    if (role === 'teacher' && await checkEmail('teachmate.teachers', email, 'teachid')) {
        await client.query('ROLLBACK');
        return false; // Email already exists in teachmate.teachers
    }
    if (role === 'student' && await checkEmail('studentmate.students', email, 'sid')) {
        await client.query('ROLLBACK');
        return false; // Email already exists in studentmate.students
    }
    // --- End duplicate email checks ---

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    let roleSpecificId: number | null = null; // This will hold teachid or sid
    console.log("username:%s , email:%s , passwordHash:%s",username, email, passwordHash);
    // 1. Create record in role-specific table FIRST to get its generated ID
    if (role === 'teacher') {
      const teacherResult = await client.query(
        'INSERT INTO teachmate.teachers (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING teachid',
        [username, email, passwordHash]
      );
      console.table(teacherResult.rows);
      roleSpecificId = teacherResult.rows[0].teachid;
      if (subjectIds && subjectIds.length > 0) {
          // ensure roleSpecificId is not null before passing to assignSubjectsToTeacher
          if (roleSpecificId !== null) {
            await assignSubjectsToTeacher(roleSpecificId, subjectIds, client);
          }
      }
    } else if (role === 'student') {
      const studentResult = await client.query(
        'INSERT INTO studentmate.students (sname, email, password_hash) VALUES ($1, $2, $3) RETURNING sid',
        [username, email, passwordHash]
      );
      roleSpecificId = studentResult.rows[0].sid;
      if (roleSpecificId !== null) { // Ensure roleSpecificId is not null before using for assignments
          if (gurukulId !== null && gurukulId !== undefined) {
              await assignGurukulToStudent(roleSpecificId, gurukulId, client);
          }
          if (milestoneId !== null && milestoneId !== undefined) {
              await assignMilestoneToStudent(roleSpecificId, milestoneId, client);
          }
      }
    } else {
        // Handle unsupported roles or throw an error. For now, roleSpecificId remains null.
    }

    // 2. Create user in public.users table, linking to the role-specific ID
    const userResult = await client.query(
      'INSERT INTO public.users (username, email, role, user_role_link) VALUES ($1, $2, $3, $4) RETURNING userid, username, email, role, isdeleted, created_at, user_role_link',
      [username, email, role, roleSpecificId] // Link it here!
    );
    const newUser = userResult.rows[0];

    await client.query('COMMIT');
    return await findUserById(newUser.userid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createNewUser:', error);
    throw new Error('Could not create user');
  } finally {
    client.release();
  }
};

/**
 * Updates an existing user in public.users, and propagates changes to role-specific tables.
 * @param userid The public.users.userid of the user to update.
 * @param userData Object containing optional username, email, role, subject_ids (for teachers), gurukulId, and milestoneId (for students).
 * @returns A Promise that resolves to the updated User object if successful, undefined if not found.
 * Returns false if the update would create a duplicate email.
 * Returns '404' string if user itself is not found.
 */
export const updateExistingUser = async (
    userid: number,
    userData: { username?: string; email?: string; role?: string; subject_ids?: number[]; gurukulId?: number | null; milestoneId?: number | null }
): Promise<any | false | '404'> => {
  const { username, email, role, subject_ids, gurukulId, milestoneId } = userData;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentUserResult = await client.query('SELECT userid, username, email, role, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE', [userid]);
    const currentUser = currentUserResult.rows[0];
    if (!currentUser) {
      await client.query('ROLLBACK');
      return '404'; // User not found in public.users
    }

    const targetEmail = email !== undefined ? email : currentUser.email;

    // --- Critical: Check for duplicate emails across all relevant tables if email is changing ---
    if (email !== undefined && email !== currentUser.email) {
      const checkDuplicateEmail = async (tbl: string, emailVal: string, idCol: string, currentId: number | null) => {
          const res = await client.query(`SELECT ${idCol} FROM ${tbl} WHERE email = $1 AND ${idCol} != $2`, [emailVal, currentId]);
          return res.rowCount && res.rowCount > 0;
      };

      if (await client.query('SELECT userid FROM public.users WHERE email = $1 AND userid != $2 AND isdeleted = FALSE', [targetEmail, userid]).then(res => res.rowCount && res.rowCount > 0)) {
        await client.query('ROLLBACK');
        return false; // Email already exists for another public user
      }
      if (currentUser.role === 'teacher' && currentUser.user_role_link && await checkDuplicateEmail('teachmate.teachers', targetEmail, 'teachid', currentUser.user_role_link)) {
          await client.query('ROLLBACK');
          return false; // Email already exists for another teacher
      }
      if (currentUser.role === 'student' && currentUser.user_role_link && await checkDuplicateEmail('studentmate.students', targetEmail, 'sid', currentUser.user_role_link)) {
          await client.query('ROLLBACK');
          return false; // Email already exists for another student
      }
    }
    // --- End duplicate email checks ---


    // 1. Update public.users table
    const publicUserFields: string[] = [];
    const publicUserValues: any[] = [];
    let publicUserParamIndex = 1;

    // Only add to fields/values if actually provided (not undefined)
    if (username !== undefined) {
        publicUserFields.push(`username = $${publicUserParamIndex++}`);
        publicUserValues.push(username);
    }
    if (email !== undefined) {
        publicUserFields.push(`email = $${publicUserParamIndex++}`);
        publicUserValues.push(email);
    }
    if (role !== undefined) {
        publicUserFields.push(`role = $${publicUserParamIndex++}`);
        publicUserValues.push(role);
    }

    if (publicUserFields.length > 0) {
        publicUserValues.push(userid);
        const userUpdateQuery = `UPDATE public.users SET ${publicUserFields.join(', ')} WHERE userid = $${publicUserParamIndex} RETURNING userid, role, user_role_link`;
        const userUpdateResult = await client.query(userUpdateQuery, publicUserValues);
        if (userUpdateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return '404';
        }
    }
    
    // Get the most up-to-date user data including potentially updated role and user_role_link
    const updatedPublicUser = await findUserById(userid);
    if (!updatedPublicUser) {
        await client.query('ROLLBACK');
        return '404';
    }

    // 2. Propagate updates to role-specific tables using their actual PKs (from user_role_link)
    if (updatedPublicUser.role === 'teacher' && updatedPublicUser.user_role_link !== null && updatedPublicUser.user_role_link !== undefined) {
        const teacherId = updatedPublicUser.user_role_link; // Guaranteed to be number here
        const teacherFields: string[] = [];
        const teacherValues: any[] = [];
        let teacherParamIndex = 1;

        if (username !== undefined) { // Access username directly from parameter, not scope
            teacherFields.push(`name = $${teacherParamIndex++}`);
            teacherValues.push(username);
        }
        if (email !== undefined) { // Access email directly from parameter, not scope
            teacherFields.push(`email = $${teacherParamIndex++}`);
            teacherValues.push(email);
        }
        if (teacherFields.length > 0) {
            teacherValues.push(teacherId);
            await client.query(
                `UPDATE teachmate.teachers SET ${teacherFields.join(', ')} WHERE teachid = $${teacherParamIndex}`,
                teacherValues
            );
        }
        if (subject_ids !== undefined) {
            await assignSubjectsToTeacher(teacherId, subject_ids, client);
        }
    } else if (updatedPublicUser.role === 'student' && updatedPublicUser.user_role_link !== null && updatedPublicUser.user_role_link !== undefined) {
        const studentId = updatedPublicUser.user_role_link; // Guaranteed to be number here
        const studentFields: string[] = [];
        const studentValues: any[] = [];
        let studentParamIndex = 1;

        if (username !== undefined) { // Access username directly from parameter, not scope
            studentFields.push(`sname = $${studentParamIndex++}`);
            studentValues.push(username);
        }
        if (email !== undefined) { // Access email directly from parameter, not scope
            studentFields.push(`email = $${studentParamIndex++}`);
            studentValues.push(email);
        }
        if (studentFields.length > 0) {
            studentValues.push(studentId);
            await client.query(
                `UPDATE studentmate.students SET ${studentFields.join(', ')} WHERE sid = $${studentParamIndex}`,
                studentValues
            );
        }
        if (gurukulId !== undefined) {
            await assignGurukulToStudent(studentId, gurukulId, client);
        }
        if (milestoneId !== undefined) {
            await assignMilestoneToStudent(studentId, milestoneId, client);
        }
    }

    await client.query('COMMIT');
    return await findUserById(userid);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in updateExistingUser (User ID: ${userid}):`, error);
    throw new Error(`Could not update user with ID ${userid}`);
  } finally {
    client.release();
  }
};

/**
 * "Deletes" a user by setting their isdeleted flag to TRUE in public.users,
 * and also deletes their entry from role-specific tables (programmatic deletion).
 * Uses user_role_link to find the role-specific PK.
 * @param userid The public.users.userid to soft-delete.
 * @returns A Promise that resolves to true if deletion was successful, false if user not found.
 */
export const softDeleteUserById = async (userid: number): Promise<boolean> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT role, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE', [userid]);
    const userRow = userResult.rows[0];
    const userRole = userRow?.role;
    const userRoleLink = userRow?.user_role_link;

    if (!userRole) {
        await client.query('ROLLBACK');
        return false;
    }

    const deleteUserResult = await client.query(
      'UPDATE public.users SET isdeleted = TRUE WHERE userid = $1 AND isdeleted = FALSE RETURNING userid',
      [userid]
    );
    const deleted = (deleteUserResult.rowCount != null && deleteUserResult.rowCount > 0);

    if (deleted) {
        if (userRole === 'teacher' && userRoleLink !== null && userRoleLink !== undefined) {
            await client.query('DELETE FROM teachmate.teachers WHERE teachid = $1', [userRoleLink]);
        } else if (userRole === 'student' && userRoleLink !== null && userRoleLink !== undefined) {
            await client.query('DELETE FROM studentmate.students WHERE sid = $1', [userRoleLink]);
        }
    }

    await client.query('COMMIT');
    return deleted;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in softDeleteUserById (User ID: ${userid}):`, error);
    throw new Error(`Could not soft delete user with ID ${userid}`);
  } finally {
    client.release();
  }
};

/**
 * Retrieves all subjects assigned to a specific teacher.
 * IMPORTANT: This function expects teachmate.teachers.teachid.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @returns A Promise that resolves to an array of Subject objects assigned to the teacher.
 */
export const findSubjectsAssignedToTeacher = async (teachid: number): Promise<any[]> => {
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
    console.error(`Error in findSubjectsAssignedToTeacher (Teacher ID: ${teachid}):`, error);
    throw new Error(`Could not retrieve subjects for teacher ID ${teachid}`);
  }
};

/**
 * Assigns one or more subjects to a teacher.
 * IMPORTANT: This function expects teachmate.teachers.teachid.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @param subjectIds An array of subject IDs to assign.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns A Promise that resolves to true if assignments are successful.
 */
export const assignSubjectsToTeacher = async (teachid: number, subjectIds: number[], queryClient: any): Promise<boolean> => { // Changed type to any
  try {
    const teacher = await queryClient.query('SELECT teachid FROM teachmate.teachers WHERE teachid = $1', [teachid]);
    if (teacher.rowCount === 0) {
      console.warn(`Teacher with TEACHID ${teachid} not found. Cannot assign subjects.`);
      return false;
    }

    await queryClient.query('DELETE FROM teachmate.teacher_assignments WHERE teacher_id = $1', [teachid]);

    for (const subid of subjectIds) {
      const subjectExists = await findSubjectById(subid);
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
    console.error(`Error in assignSubjectsToTeacher (Teacher ID: ${teachid}, Subjects: ${subjectIds}):`, error);
    throw new Error('Could not assign subjects to teacher');
  }
};

// --- Student-Specific Assignment Functions ---

/**
 * Assigns a gurukul to a student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @param gurukulId The ID of the gurukul to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
export const assignGurukulToStudent = async (sid: number, gurukulId: number | null, queryClient: any): Promise<boolean> => { // Changed type to any
    try {
        const student = await queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign gurukul.`);
            return false;
        }

        await queryClient.query('DELETE FROM studentmate.sgurukul WHERE sid = $1', [sid]);

        if (gurukulId !== null) {
            const gurukulExists = await findGurukulById(gurukulId);
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
        console.error(`Error in assignGurukulToStudent (Student ID: ${sid}, Gurukul ID: ${gurukulId}):`, error);
        throw new Error('Could not assign gurukul to student');
    }
};

/**
 * Assigns a milestone to a student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @param milestoneId The ID of the milestone to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
export const assignMilestoneToStudent = async (sid: number, milestoneId: number | null, queryClient: any): Promise<boolean> => { // Changed type to any
    try {
        const student = await queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign milestone.`);
            return false;
        }

        await queryClient.query('DELETE FROM studentmate.smilestones WHERE sid = $1', [sid]);
        console.log("assignMilestoneToStudent: %s smilestones deleted",sid);
        if (milestoneId !== null) {
            const milestoneExists = await findMilestoneById(milestoneId);
            if (!milestoneExists) {
                console.warn(`Milestone with ID ${milestoneId} not found during assignment to student ${sid}. Skipping.`);
                return false;
            }
            await queryClient.query(
                'INSERT INTO studentmate.smilestones (sid, mid, status, starttime) VALUES ($1, $2, $3, NOW())',
                [sid, milestoneId, 'Started']
            );
            console.log("assignMilestoneToStudent: %s smilestones new created",sid);
        }
        return true;
    } catch (error) {
        console.error(`Error in assignMilestoneToStudent (Student ID: ${sid}, Milestone ID: ${milestoneId}):`, error);
        throw new Error('Could not assign milestone to student');
    }
};


/**
 * Retrieves gurukul details assigned to a specific student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Gurukul objects assigned to the student.
 */
export const findGurukulsAssignedToStudent = async (sid: number): Promise<any[]> => {
    try {
      console.log(`findGurukulsAssignedToStudent ${sid} `);

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
        // Check if result is found
if (result.rows.length === 0) {
  console.log(`No gurukuls found for student ID ${sid}`);
} else {
  console.log(`Gurukuls assigned to student ID ${sid}:`);
  console.table(result.rows); // 👈 best for tabular display
}
        return result.rows;
    } catch (error) {
        console.error(`Error in findGurukulsAssignedToStudent (Student ID: ${sid}):`, error);
        throw new Error(`Could not retrieve gurukuls for student ID ${sid}`);
    }
};

/**
 * Retrieves milestone details assigned to a specific student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Milestone objects assigned to the student.
 */
export const findMilestonesAssignedToStudent = async (sid: number): Promise<any[]> => {
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
        // Check if result is found
if (result.rows.length === 0) {
  console.log(`No milestones found for student ID ${sid}`);
} else {
  console.log(`PPPP Milestones assigned to student ID ${sid}:`);
  console.table(result.rows); // 👈 best for tabular display
}
        return result.rows;
    } catch (error) {
        console.error(`Error in findMilestonesAssignedToStudent (Student ID: ${sid}):`, error);
        throw new Error('Could not retrieve milestones for student ID ${sid}');
    }
};
