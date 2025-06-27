"use strict";
// services/userService.ts - Targeted Type Fixes
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMilestonesAssignedToStudent = exports.findGurukulsAssignedToStudent = exports.assignMilestoneToStudent = exports.assignGurukulToStudent = exports.assignSubjectsToTeacher = exports.findSubjectsAssignedToTeacher = exports.softDeleteUserById = exports.updateExistingUser = exports.createNewUser = exports.findUserById = exports.findAllUsers = void 0;
const db_1 = __importDefault(require("../utils/db"));
const subjectService_1 = require("./subjectService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const gurukulService_1 = require("./gurukulService");
const milestoneService_1 = require("./milestoneService");
// --- Helper to get role-specific ID and link from public.users.userid ---
const getRoleSpecificIds = (userid, role) => __awaiter(void 0, void 0, void 0, function* () {
    let roleSpecificId = null;
    let userLinkData = null; // Contains the teachid or sid AND the user_id_link
    if (role === 'teacher') {
        const result = yield db_1.default.query('SELECT teachid, user_id_link FROM teachmate.teachers WHERE user_id_link = $1', [userid]);
        userLinkData = result.rows[0];
        if (userLinkData) {
            roleSpecificId = userLinkData.teachid;
        }
    }
    else if (role === 'student') {
        const result = yield db_1.default.query('SELECT sid, user_id_link FROM studentmate.students WHERE user_id_link = $1', [userid]);
        userLinkData = result.rows[0];
        if (userLinkData) {
            roleSpecificId = userLinkData.sid;
        }
    }
    return { roleSpecificId, userLinkData };
});
// --- User Service Functions ---
/**
 * Retrieves all users from the public.users table.
 * Enhances results with role-specific data (teachid/sid, assigned subjects/gurukuls/milestones).
 * Finds role-specific data by looking up the user_role_link and role type.
 * @param role Optional role to filter by.
 * @returns An array of User objects with enhanced details.
 */
const findAllUsers = (role) => __awaiter(void 0, void 0, void 0, function* () {
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
        const queryParams = [];
        let paramIndex = 1;
        if (role) {
            queryText += ` AND u.role = $${paramIndex++}`;
            queryParams.push(role);
        }
        queryText += ` ORDER BY u.username ASC`;
        const result = yield db_1.default.query(queryText, queryParams);
        const users = result.rows;
        const enhancedUsers = [];
        for (const user of users) {
            if (user.role === 'teacher' && user.user_role_link) {
                const teacherResult = yield db_1.default.query('SELECT teachid, last_login FROM teachmate.teachers WHERE teachid = $1', [user.user_role_link]);
                if (teacherResult.rows[0]) {
                    user.teachid = teacherResult.rows[0].teachid;
                    user.last_login = teacherResult.rows[0].last_login;
                    user.assigned_subjects = yield (0, exports.findSubjectsAssignedToTeacher)(user.teachid);
                }
            }
            else if (user.role === 'student' && user.user_role_link) {
                const studentResult = yield db_1.default.query('SELECT sid FROM studentmate.students WHERE sid = $1', [user.user_role_link]);
                if (studentResult.rows[0]) {
                    user.sid = studentResult.rows[0].sid;
                    user.assigned_gurukuls = yield (0, exports.findGurukulsAssignedToStudent)(user.sid);
                    user.assigned_milestones = yield (0, exports.findMilestonesAssignedToStudent)(user.sid);
                }
            }
            enhancedUsers.push(user);
        }
        return enhancedUsers;
    }
    catch (error) {
        console.error('Error in findAllUsers:', error);
        throw new Error('Could not retrieve users');
    }
});
exports.findAllUsers = findAllUsers;
/**
 * Retrieves a single user by their ID from public.users, enhancing with role-specific data.
 * @param userid The public.users.userid.
 * @returns A User object with full details, or undefined.
 */
const findUserById = (userid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query(`SELECT userid, username, email, role, isdeleted, created_at, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE`, [userid]);
        const user = result.rows[0];
        if (user) {
            if (user.role === 'teacher' && user.user_role_link) {
                const teacherResult = yield db_1.default.query('SELECT teachid, last_login FROM teachmate.teachers WHERE teachid = $1', [user.user_role_link]);
                if (teacherResult.rows[0]) {
                    user.teachid = teacherResult.rows[0].teachid;
                    user.last_login = teacherResult.rows[0].last_login;
                    user.assigned_subjects = yield (0, exports.findSubjectsAssignedToTeacher)(user.teachid);
                }
            }
            else if (user.role === 'student' && user.user_role_link) {
                const studentResult = yield db_1.default.query('SELECT sid FROM studentmate.students WHERE sid = $1', [user.user_role_link]);
                if (studentResult.rows[0]) {
                    user.sid = studentResult.rows[0].sid;
                    user.assigned_gurukuls = yield (0, exports.findGurukulsAssignedToStudent)(user.sid);
                    user.assigned_milestones = yield (0, exports.findMilestonesAssignedToStudent)(user.sid);
                }
            }
        }
        return user;
    }
    catch (error) {
        console.error(`Error in findUserById (User ID: ${userid}):`, error);
        throw new Error(`Could not retrieve user with ID ${userid}`);
    }
});
exports.findUserById = findUserById;
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
const createNewUser = (username, email, role, gurukulId, milestoneId, subjectIds) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.default.connect(); // Get a PoolClient for the transaction
    try {
        yield client.query('BEGIN'); // Start transaction
        // --- Critical: Check for duplicate emails across all relevant tables first ---
        const checkEmail = (tbl_1, emailVal_1, idCol_1, ...args_1) => __awaiter(void 0, [tbl_1, emailVal_1, idCol_1, ...args_1], void 0, function* (tbl, emailVal, idCol, whereCol = 'email') {
            const res = yield client.query(`SELECT ${idCol} FROM ${tbl} WHERE ${whereCol} = $1`, [emailVal]);
            return res.rowCount && res.rowCount > 0;
        });
        if (yield checkEmail('public.users', email, 'userid', 'email')) {
            yield client.query('ROLLBACK');
            return false; // Email already exists in public.users
        }
        if (role === 'teacher' && (yield checkEmail('teachmate.teachers', email, 'teachid'))) {
            yield client.query('ROLLBACK');
            return false; // Email already exists in teachmate.teachers
        }
        if (role === 'student' && (yield checkEmail('studentmate.students', email, 'sid'))) {
            yield client.query('ROLLBACK');
            return false; // Email already exists in studentmate.students
        }
        // --- End duplicate email checks ---
        const defaultPassword = 'password123';
        const passwordHash = yield bcryptjs_1.default.hash(defaultPassword, 10);
        let roleSpecificId = null; // This will hold teachid or sid
        console.log("username:%s , email:%s , passwordHash:%s", username, email, passwordHash);
        // 1. Create record in role-specific table FIRST to get its generated ID
        if (role === 'teacher') {
            const teacherResult = yield client.query('INSERT INTO teachmate.teachers (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING teachid', [username, email, passwordHash]);
            console.table(teacherResult.rows);
            roleSpecificId = teacherResult.rows[0].teachid;
            if (subjectIds && subjectIds.length > 0) {
                // ensure roleSpecificId is not null before passing to assignSubjectsToTeacher
                if (roleSpecificId !== null) {
                    yield (0, exports.assignSubjectsToTeacher)(roleSpecificId, subjectIds, client);
                }
            }
        }
        else if (role === 'student') {
            const studentResult = yield client.query('INSERT INTO studentmate.students (sname, email, password_hash) VALUES ($1, $2, $3) RETURNING sid', [username, email, passwordHash]);
            roleSpecificId = studentResult.rows[0].sid;
            if (roleSpecificId !== null) { // Ensure roleSpecificId is not null before using for assignments
                if (gurukulId !== null && gurukulId !== undefined) {
                    yield (0, exports.assignGurukulToStudent)(roleSpecificId, gurukulId, client);
                }
                if (milestoneId !== null && milestoneId !== undefined) {
                    yield (0, exports.assignMilestoneToStudent)(roleSpecificId, milestoneId, client);
                }
            }
        }
        else {
            // Handle unsupported roles or throw an error. For now, roleSpecificId remains null.
        }
        // 2. Create user in public.users table, linking to the role-specific ID
        const userResult = yield client.query('INSERT INTO public.users (username, email, role, user_role_link) VALUES ($1, $2, $3, $4) RETURNING userid, username, email, role, isdeleted, created_at, user_role_link', [username, email, role, roleSpecificId] // Link it here!
        );
        const newUser = userResult.rows[0];
        yield client.query('COMMIT');
        return yield (0, exports.findUserById)(newUser.userid);
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error('Error in createNewUser:', error);
        throw new Error('Could not create user');
    }
    finally {
        client.release();
    }
});
exports.createNewUser = createNewUser;
/**
 * Updates an existing user in public.users, and propagates changes to role-specific tables.
 * @param userid The public.users.userid of the user to update.
 * @param userData Object containing optional username, email, role, subject_ids (for teachers), gurukulId, and milestoneId (for students).
 * @returns A Promise that resolves to the updated User object if successful, undefined if not found.
 * Returns false if the update would create a duplicate email.
 * Returns '404' string if user itself is not found.
 */
const updateExistingUser = (userid, userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, role, subject_ids, gurukulId, milestoneId } = userData;
    const client = yield db_1.default.connect();
    try {
        yield client.query('BEGIN');
        const currentUserResult = yield client.query('SELECT userid, username, email, role, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE', [userid]);
        const currentUser = currentUserResult.rows[0];
        if (!currentUser) {
            yield client.query('ROLLBACK');
            return '404'; // User not found in public.users
        }
        const targetEmail = email !== undefined ? email : currentUser.email;
        // --- Critical: Check for duplicate emails across all relevant tables if email is changing ---
        if (email !== undefined && email !== currentUser.email) {
            const checkDuplicateEmail = (tbl, emailVal, idCol, currentId) => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield client.query(`SELECT ${idCol} FROM ${tbl} WHERE email = $1 AND ${idCol} != $2`, [emailVal, currentId]);
                return res.rowCount && res.rowCount > 0;
            });
            if (yield client.query('SELECT userid FROM public.users WHERE email = $1 AND userid != $2 AND isdeleted = FALSE', [targetEmail, userid]).then(res => res.rowCount && res.rowCount > 0)) {
                yield client.query('ROLLBACK');
                return false; // Email already exists for another public user
            }
            if (currentUser.role === 'teacher' && currentUser.user_role_link && (yield checkDuplicateEmail('teachmate.teachers', targetEmail, 'teachid', currentUser.user_role_link))) {
                yield client.query('ROLLBACK');
                return false; // Email already exists for another teacher
            }
            if (currentUser.role === 'student' && currentUser.user_role_link && (yield checkDuplicateEmail('studentmate.students', targetEmail, 'sid', currentUser.user_role_link))) {
                yield client.query('ROLLBACK');
                return false; // Email already exists for another student
            }
        }
        // --- End duplicate email checks ---
        // 1. Update public.users table
        const publicUserFields = [];
        const publicUserValues = [];
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
            const userUpdateResult = yield client.query(userUpdateQuery, publicUserValues);
            if (userUpdateResult.rows.length === 0) {
                yield client.query('ROLLBACK');
                return '404';
            }
        }
        // Get the most up-to-date user data including potentially updated role and user_role_link
        const updatedPublicUser = yield (0, exports.findUserById)(userid);
        if (!updatedPublicUser) {
            yield client.query('ROLLBACK');
            return '404';
        }
        // 2. Propagate updates to role-specific tables using their actual PKs (from user_role_link)
        if (updatedPublicUser.role === 'teacher' && updatedPublicUser.user_role_link !== null && updatedPublicUser.user_role_link !== undefined) {
            const teacherId = updatedPublicUser.user_role_link; // Guaranteed to be number here
            const teacherFields = [];
            const teacherValues = [];
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
                yield client.query(`UPDATE teachmate.teachers SET ${teacherFields.join(', ')} WHERE teachid = $${teacherParamIndex}`, teacherValues);
            }
            if (subject_ids !== undefined) {
                yield (0, exports.assignSubjectsToTeacher)(teacherId, subject_ids, client);
            }
        }
        else if (updatedPublicUser.role === 'student' && updatedPublicUser.user_role_link !== null && updatedPublicUser.user_role_link !== undefined) {
            const studentId = updatedPublicUser.user_role_link; // Guaranteed to be number here
            const studentFields = [];
            const studentValues = [];
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
                yield client.query(`UPDATE studentmate.students SET ${studentFields.join(', ')} WHERE sid = $${studentParamIndex}`, studentValues);
            }
            if (gurukulId !== undefined) {
                yield (0, exports.assignGurukulToStudent)(studentId, gurukulId, client);
            }
            if (milestoneId !== undefined) {
                yield (0, exports.assignMilestoneToStudent)(studentId, milestoneId, client);
            }
        }
        yield client.query('COMMIT');
        return yield (0, exports.findUserById)(userid);
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error(`Error in updateExistingUser (User ID: ${userid}):`, error);
        throw new Error(`Could not update user with ID ${userid}`);
    }
    finally {
        client.release();
    }
});
exports.updateExistingUser = updateExistingUser;
/**
 * "Deletes" a user by setting their isdeleted flag to TRUE in public.users,
 * and also deletes their entry from role-specific tables (programmatic deletion).
 * Uses user_role_link to find the role-specific PK.
 * @param userid The public.users.userid to soft-delete.
 * @returns A Promise that resolves to true if deletion was successful, false if user not found.
 */
const softDeleteUserById = (userid) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.default.connect();
    try {
        yield client.query('BEGIN');
        const userResult = yield client.query('SELECT role, user_role_link FROM public.users WHERE userid = $1 AND isdeleted = FALSE', [userid]);
        const userRow = userResult.rows[0];
        const userRole = userRow === null || userRow === void 0 ? void 0 : userRow.role;
        const userRoleLink = userRow === null || userRow === void 0 ? void 0 : userRow.user_role_link;
        if (!userRole) {
            yield client.query('ROLLBACK');
            return false;
        }
        const deleteUserResult = yield client.query('UPDATE public.users SET isdeleted = TRUE WHERE userid = $1 AND isdeleted = FALSE RETURNING userid', [userid]);
        const deleted = (deleteUserResult.rowCount != null && deleteUserResult.rowCount > 0);
        if (deleted) {
            if (userRole === 'teacher' && userRoleLink !== null && userRoleLink !== undefined) {
                yield client.query('DELETE FROM teachmate.teachers WHERE teachid = $1', [userRoleLink]);
            }
            else if (userRole === 'student' && userRoleLink !== null && userRoleLink !== undefined) {
                yield client.query('DELETE FROM studentmate.students WHERE sid = $1', [userRoleLink]);
            }
        }
        yield client.query('COMMIT');
        return deleted;
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error(`Error in softDeleteUserById (User ID: ${userid}):`, error);
        throw new Error(`Could not soft delete user with ID ${userid}`);
    }
    finally {
        client.release();
    }
});
exports.softDeleteUserById = softDeleteUserById;
/**
 * Retrieves all subjects assigned to a specific teacher.
 * IMPORTANT: This function expects teachmate.teachers.teachid.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @returns A Promise that resolves to an array of Subject objects assigned to the teacher.
 */
const findSubjectsAssignedToTeacher = (teachid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query(`SELECT
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
          s.subname ASC`, [teachid]);
        return result.rows;
    }
    catch (error) {
        console.error(`Error in findSubjectsAssignedToTeacher (Teacher ID: ${teachid}):`, error);
        throw new Error(`Could not retrieve subjects for teacher ID ${teachid}`);
    }
});
exports.findSubjectsAssignedToTeacher = findSubjectsAssignedToTeacher;
/**
 * Assigns one or more subjects to a teacher.
 * IMPORTANT: This function expects teachmate.teachers.teachid.
 * @param teachid The teachmate.teachers.teachid of the teacher.
 * @param subjectIds An array of subject IDs to assign.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns A Promise that resolves to true if assignments are successful.
 */
const assignSubjectsToTeacher = (teachid, subjectIds, queryClient) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teacher = yield queryClient.query('SELECT teachid FROM teachmate.teachers WHERE teachid = $1', [teachid]);
        if (teacher.rowCount === 0) {
            console.warn(`Teacher with TEACHID ${teachid} not found. Cannot assign subjects.`);
            return false;
        }
        yield queryClient.query('DELETE FROM teachmate.teacher_assignments WHERE teacher_id = $1', [teachid]);
        for (const subid of subjectIds) {
            const subjectExists = yield (0, subjectService_1.findSubjectById)(subid);
            if (!subjectExists) {
                console.warn(`Subject with ID ${subid} not found during assignment to teacher ${teachid}. Skipping.`);
            }
            else {
                yield queryClient.query('INSERT INTO teachmate.teacher_assignments (teacher_id, sub_id, isapprover) VALUES ($1, $2, FALSE)', [teachid, subid]);
            }
        }
        return true;
    }
    catch (error) {
        console.error(`Error in assignSubjectsToTeacher (Teacher ID: ${teachid}, Subjects: ${subjectIds}):`, error);
        throw new Error('Could not assign subjects to teacher');
    }
});
exports.assignSubjectsToTeacher = assignSubjectsToTeacher;
// --- Student-Specific Assignment Functions ---
/**
 * Assigns a gurukul to a student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @param gurukulId The ID of the gurukul to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
const assignGurukulToStudent = (sid, gurukulId, queryClient) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign gurukul.`);
            return false;
        }
        yield queryClient.query('DELETE FROM studentmate.sgurukul WHERE sid = $1', [sid]);
        if (gurukulId !== null) {
            const gurukulExists = yield (0, gurukulService_1.findGurukulById)(gurukulId);
            if (!gurukulExists) {
                console.warn(`Gurukul with ID ${gurukulId} not found during assignment to student ${sid}. Skipping.`);
                return false;
            }
            yield queryClient.query('INSERT INTO studentmate.sgurukul (sid, gid, status, starttime) VALUES ($1, $2, $3, NOW())', [sid, gurukulId, 'Started']);
        }
        return true;
    }
    catch (error) {
        console.error(`Error in assignGurukulToStudent (Student ID: ${sid}, Gurukul ID: ${gurukulId}):`, error);
        throw new Error('Could not assign gurukul to student');
    }
});
exports.assignGurukulToStudent = assignGurukulToStudent;
/**
 * Assigns a milestone to a student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @param milestoneId The ID of the milestone to assign, or null to clear.
 * @param queryClient The PG PoolClient object for transactional consistency.
 * @returns True if successful.
 */
const assignMilestoneToStudent = (sid, milestoneId, queryClient) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield queryClient.query('SELECT sid FROM studentmate.students WHERE sid = $1', [sid]);
        if (student.rowCount === 0) {
            console.warn(`Student with SID ${sid} not found. Cannot assign milestone.`);
            return false;
        }
        yield queryClient.query('DELETE FROM studentmate.smilestones WHERE sid = $1', [sid]);
        console.log("assignMilestoneToStudent: %s smilestones deleted", sid);
        if (milestoneId !== null) {
            const milestoneExists = yield (0, milestoneService_1.findMilestoneById)(milestoneId);
            if (!milestoneExists) {
                console.warn(`Milestone with ID ${milestoneId} not found during assignment to student ${sid}. Skipping.`);
                return false;
            }
            yield queryClient.query('INSERT INTO studentmate.smilestones (sid, mid, status, starttime) VALUES ($1, $2, $3, NOW())', [sid, milestoneId, 'Started']);
            console.log("assignMilestoneToStudent: %s smilestones new created", sid);
        }
        return true;
    }
    catch (error) {
        console.error(`Error in assignMilestoneToStudent (Student ID: ${sid}, Milestone ID: ${milestoneId}):`, error);
        throw new Error('Could not assign milestone to student');
    }
});
exports.assignMilestoneToStudent = assignMilestoneToStudent;
/**
 * Retrieves gurukul details assigned to a specific student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Gurukul objects assigned to the student.
 */
const findGurukulsAssignedToStudent = (sid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`findGurukulsAssignedToStudent ${sid} `);
        const result = yield db_1.default.query(`SELECT
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
                sg.sid = $1`, [sid]);
        // Check if result is found
        if (result.rows.length === 0) {
            console.log(`No gurukuls found for student ID ${sid}`);
        }
        else {
            console.log(`Gurukuls assigned to student ID ${sid}:`);
            console.table(result.rows); // 👈 best for tabular display
        }
        return result.rows;
    }
    catch (error) {
        console.error(`Error in findGurukulsAssignedToStudent (Student ID: ${sid}):`, error);
        throw new Error(`Could not retrieve gurukuls for student ID ${sid}`);
    }
});
exports.findGurukulsAssignedToStudent = findGurukulsAssignedToStudent;
/**
 * Retrieves milestone details assigned to a specific student.
 * IMPORTANT: This function expects studentmate.students.sid.
 * @param sid The studentmate.students.sid of the student.
 * @returns A Promise that resolves to an array of Milestone objects assigned to the student.
 */
const findMilestonesAssignedToStudent = (sid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query(`SELECT
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
                sm.sid = $1`, [sid]);
        // Check if result is found
        if (result.rows.length === 0) {
            console.log(`No milestones found for student ID ${sid}`);
        }
        else {
            console.log(`PPPP Milestones assigned to student ID ${sid}:`);
            console.table(result.rows); // 👈 best for tabular display
        }
        return result.rows;
    }
    catch (error) {
        console.error(`Error in findMilestonesAssignedToStudent (Student ID: ${sid}):`, error);
        throw new Error('Could not retrieve milestones for student ID ${sid}');
    }
});
exports.findMilestonesAssignedToStudent = findMilestonesAssignedToStudent;
