"use strict";
// services/gurukulService.ts - Handles the core business logic for Gurukuls and Gurukul Offerings
// Now interacts with the PostgreSQL database and safely handles rowCount.
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
exports.deleteGurukulOfferingById = exports.updateExistingGurukulOffering = exports.createNewGurukulOffering = exports.getGurukulOfferingsByGid = exports.findGurukulOfferingById = exports.findAllGurukulOfferings = exports.deleteGurukulAndOfferings = exports.updateExistingGurukul = exports.createNewGurukul = exports.findGurukulById = exports.findAllGurukuls = void 0;
const db_1 = __importDefault(require("../utils/db")); // Import the database connection pool
// --- Gurukul Service Functions ---
/**
 * Retrieves all gurukuls from the database.
 * @returns A Promise that resolves to an array of Gurukul objects.
 */
const findAllGurukuls = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('SELECT gid, gname FROM public.gurukul ORDER BY gid ASC');
        console.log("In findAllGurukuls");
        console.table(result.rows);
        return result.rows;
    }
    catch (error) {
        console.error('Error in findAllGurukuls:', error);
        throw new Error('Could not retrieve gurukuls');
    }
});
exports.findAllGurukuls = findAllGurukuls;
/**
 * Retrieves a single gurukul by its ID from the database.
 * @param gid The ID of the gurukul.
 * @returns A Promise that resolves to the Gurukul object if found, otherwise undefined.
 */
const findGurukulById = (gid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('SELECT gid, gname FROM public.gurukul WHERE gid = $1', [gid]);
        console.log("In findGurukulById");
        return result.rows[0]; // Returns undefined if no row is found
    }
    catch (error) {
        console.error(`Error in findGurukulById (GID: ${gid}):`, error);
        throw new Error(`Could not retrieve gurukul with ID ${gid}`);
    }
});
exports.findGurukulById = findGurukulById;
/**
 * Creates a new gurukul in the database.
 * @param gname The name of the gurukul.
 * @returns A Promise that resolves to the newly created Gurukul object.
 */
const createNewGurukul = (gname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Note: Assuming `gid` is handled by an IDENTITY column or SERIAL in your database for auto-increment.
        const result = yield db_1.default.query('INSERT INTO public.gurukul (gname) VALUES ($1) RETURNING gid, gname', [gname]);
        console.log("In createNewGurukul");
        return result.rows[0];
    }
    catch (error) {
        console.error('Error in createNewGurukul:', error);
        throw new Error('Could not create gurukul');
    }
});
exports.createNewGurukul = createNewGurukul;
/**
 * Updates an existing gurukul in the database.
 * @param gid The ID of the gurukul to update.
 * @param gname The new name for the gurukul.
 * @returns A Promise that resolves to the updated Gurukul object if successful, otherwise undefined (if not found).
 */
const updateExistingGurukul = (gid, gname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('UPDATE public.gurukul SET gname = $1 WHERE gid = $2 RETURNING gid, gname', [gname, gid]);
        console.log("updateExistingGurukul");
        return result.rows[0]; // Returns undefined if no row was updated
    }
    catch (error) {
        console.error(`Error in updateExistingGurukul (GID: ${gid}):`, error);
        throw new Error(`Could not update gurukul with ID ${gid}`);
    }
});
exports.updateExistingGurukul = updateExistingGurukul;
/**
 * Deletes a gurukul and its associated offerings from the database.
 * Uses a transaction to ensure atomicity.
 * @param gid The ID of the gurukul to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if gurukul not found.
 */
const deleteGurukulAndOfferings = (gid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const client = yield db_1.default.connect(); // Get a client from the pool
    try {
        yield client.query('BEGIN'); // Start transaction
        // First, delete associated gurukul offerings
        const deleteOfferingsResult = yield client.query('DELETE FROM public.gurukul_offerings WHERE gid = $1 RETURNING oid', [gid]);
        console.log(`Deleted ${(_a = deleteOfferingsResult.rowCount) !== null && _a !== void 0 ? _a : 0} offerings for gurukul ID ${gid}`); // Safely use rowCount
        // Then, delete the gurukul itself
        const deleteGurukulResult = yield client.query('DELETE FROM public.gurukul WHERE gid = $1 RETURNING gid', [gid]);
        yield client.query('COMMIT'); // Commit transaction
        return ((_b = deleteGurukulResult.rowCount) !== null && _b !== void 0 ? _b : 0) > 0; // Safely use rowCount
    }
    catch (error) {
        yield client.query('ROLLBACK'); // Rollback transaction on error
        console.error(`Error in deleteGurukulAndOfferings (GID: ${gid}):`, error);
        throw new Error(`Could not delete gurukul with ID ${gid} and its offerings`);
    }
    finally {
        client.release(); // Release the client back to the pool
    }
});
exports.deleteGurukulAndOfferings = deleteGurukulAndOfferings;
// --- Gurukul Offering Service Functions ---
/**
 * Retrieves all gurukul offerings from the database.
 * @returns A Promise that resolves to an array of GurukulOffering objects.
 */
const findAllGurukulOfferings = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('SELECT oid, gid, gtype FROM public.gurukul_offerings ORDER BY oid ASC');
        console.log("In findAllGurukulOfferings");
        return result.rows;
    }
    catch (error) {
        console.error('Error in findAllGurukulOfferings:', error);
        throw new Error('Could not retrieve gurukul offerings');
    }
});
exports.findAllGurukulOfferings = findAllGurukulOfferings;
/**
 * Retrieves a single gurukul offering by its ID from the database.
 * @param oid The ID of the gurukul offering.
 * @returns A Promise that resolves to the GurukulOffering object if found, otherwise undefined.
 */
const findGurukulOfferingById = (oid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('SELECT oid, gid, gtype FROM public.gurukul_offerings WHERE oid = $1', [oid]);
        console.log("In findGurukulOfferingById ");
        return result.rows[0];
    }
    catch (error) {
        console.error(`Error in findGurukulOfferingById (OID: ${oid}):`, error);
        throw new Error(`Could not retrieve gurukul offering with ID ${oid}`);
    }
});
exports.findGurukulOfferingById = findGurukulOfferingById;
const getGurukulOfferingsByGid = (gid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = 'SELECT * FROM gurukul_offerings WHERE gid = $1';
        const result = yield db_1.default.query(query, [gid]); // adjust if using ORM
        return result.rows;
    }
    catch (error) {
        console.error(`Error in getGurukulOfferingsByGid (GID: ${gid}):`, error);
        throw new Error(`Could not retrieve gurukul offering with ID ${gid}`);
    }
});
exports.getGurukulOfferingsByGid = getGurukulOfferingsByGid;
/**
 * Creates a new gurukul offering in the database.
 * @param gid The Gurukul ID it belongs to.
 * @param gtype The type of offering (G1, G2, G3, G4).
 * @returns A Promise that resolves to the newly created GurukulOffering object if successful, or throws an error.
 */
const createNewGurukulOffering = (gid, gtype) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate gtype against the CHECK constraint
    const validGTypes = ['G1', 'G2', 'G3', 'G4'];
    if (!validGTypes.includes(gtype)) {
        return undefined; // Indicate invalid gtype
    }
    try {
        // Check if Gurukul exists before creating the offering (to enforce FK constraint logic)
        const gurukulExists = yield (0, exports.findGurukulById)(gid);
        if (!gurukulExists) {
            return null; // Indicate Gurukul does not exist
        }
        // Check for duplicate offering (same gid and gtype)
        const existingOffering = yield db_1.default.query('SELECT oid FROM public.gurukul_offerings WHERE gid = $1 AND gtype = $2', [gid, gtype]);
        if (existingOffering.rowCount != null && existingOffering.rowCount > 0) {
            return false; // Indicate duplicate offering
        }
        const result = yield db_1.default.query('INSERT INTO public.gurukul_offerings (gid, gtype) VALUES ($1, $2) RETURNING oid, gid, gtype', [gid, gtype]);
        console.log("In createNewGurukulOffering ");
        return result.rows[0];
    }
    catch (error) {
        console.error('Error in createNewGurukulOffering:', error);
        throw new Error('Could not create gurukul offering');
    }
});
exports.createNewGurukulOffering = createNewGurukulOffering;
/**
 * Updates an existing gurukul offering.
 * @param oid The ID of the gurukul offering to update.
 * @param gid The new Gurukul ID it belongs to.
 * @param gtype The new type of offering.
 * @returns A Promise that resolves to the updated GurukulOffering object if successful, or throws an error.
 */
const updateExistingGurukulOffering = (oid, gid, gtype) => __awaiter(void 0, void 0, void 0, function* () {
    const validGTypes = ['G1', 'G2', 'G3', 'G4'];
    if (!validGTypes.includes(gtype)) {
        return undefined; // Indicate invalid gtype
    }
    try {
        // Check if Gurukul exists
        const gurukulExists = yield (0, exports.findGurukulById)(gid);
        if (!gurukulExists) {
            return null; // Indicate Gurukul does not exist
        }
        // Check for duplicate *for another offering* (if changing gtype or gid)
        const existingOfferingForOtherId = yield db_1.default.query('SELECT oid FROM public.gurukul_offerings WHERE gid = $1 AND gtype = $2 AND oid != $3', [gid, gtype, oid]);
        if (existingOfferingForOtherId.rowCount != null && existingOfferingForOtherId.rowCount > 0) {
            return false; // Indicate this update would create a duplicate with another existing offering
        }
        const result = yield db_1.default.query('UPDATE public.gurukul_offerings SET gid = $1, gtype = $2 WHERE oid = $3 RETURNING oid, gid, gtype', [gid, gtype, oid]);
        console.log("In updateExistingGurukulOffering");
        return result.rows[0]; // Returns undefined if no row was updated
    }
    catch (error) {
        console.error(`Error in updateExistingGurukulOffering (OID: ${oid}):`, error);
        throw new Error(`Could not update gurukul offering with ID ${oid}`);
    }
});
exports.updateExistingGurukulOffering = updateExistingGurukulOffering;
/**
 * Deletes a gurukul offering from the database.
 * @param oid The ID of the gurukul offering to delete.
 * @returns A Promise that resolves to true if deletion was successful, false if offering not found.
 */
const deleteGurukulOfferingById = (oid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield db_1.default.query('DELETE FROM public.gurukul_offerings WHERE oid = $1 RETURNING oid', [oid]);
        console.log("In deleteGurukulOfferingById ");
        return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0; // Safely use rowCount
    }
    catch (error) {
        console.error(`Error in deleteGurukulOfferingById (OID: ${oid}):`, error);
        throw new Error(`Could not delete gurukul offering with ID ${oid}`);
    }
});
exports.deleteGurukulOfferingById = deleteGurukulOfferingById;
