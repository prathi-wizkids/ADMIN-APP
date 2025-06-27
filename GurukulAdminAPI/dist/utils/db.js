"use strict";
// utils/db.ts - PostgreSQL Database Connection Pool
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg"); // Import the Pool class from 'pg'
// Log environment variables BEFORE initializing the pool
console.log('--- Database Environment Variables ---');
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
// console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '********' : 'UNDEFINED'}`); // Mask password in logs
console.log('------------------------------------');
// Load environment variables (assuming you have a .env file and a loader like 'dotenv' in index.ts)
// For this setup, we will directly access process.env.
// In a real application, you might use a config library or dotenv.config() at startup.
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST, // This will be your A.B.C.D
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10), // Parse port as integer, default to 5432
});
// Event listener for database connection errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // process.exit(-1); // In a production app, you might want to gracefully restart or log
});
// Test connection when the pool is initialized
pool.query('SELECT NOW()')
    .then(() => console.log('Database connected successfully!'))
    .catch(err => console.error('Database connection test failed:', err.message));
console.log(`Database pool initialized for ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
// Export the pool to be used throughout the application
exports.default = pool;
