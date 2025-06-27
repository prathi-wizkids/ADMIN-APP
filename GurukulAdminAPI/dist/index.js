"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts - Main API Entry Point
// Load environment variables from .env file FIRST THING
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express")); // Import NextFunction
const body_parser_1 = __importDefault(require("body-parser"));
const gururkulRoutes_1 = __importDefault(require("./routes/gururkulRoutes"));
const milestoneRoutes_1 = __importDefault(require("./routes/milestoneRoutes")); // Import new milestone routes
const subjectRoutes_1 = __importDefault(require("./routes/subjectRoutes")); // Import new subject routes
const topicRoutes_1 = __importDefault(require("./routes/topicRoutes")); // Import new topic routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Import new user routes
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON request bodies
app.use(body_parser_1.default.json());
// Basic route for testing the server
app.get('/', (req, res) => {
    res.send('Gurukul Admin API is running!');
});
// Use the Gurukul and Gurukul Offerings routes
app.use('/', gururkulRoutes_1.default);
// Use the Milestone routes
// We'll mount it at '/milestones'
app.use('/milestones', milestoneRoutes_1.default);
// Use the Subject routes
app.use('/subjects', subjectRoutes_1.default); // New route for subjects
// Use the Topic routes
app.use('/topics', topicRoutes_1.default); // New route for topics
// Use the User routes
app.use('/users', userRoutes_1.default); // New route for users
// --- Centralized Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).json({
        message: 'An unexpected error occurred',
        error: err.message, // Send error message to client
    });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Gurukul routes will be accessible directly:`);
    console.log(`   http://localhost:${PORT}/gurukul`);
    console.log(`   http://localhost:${PORT}/gurukul-offerings`);
    console.log(`Milestone routes will be accessible at:`);
    console.log(`   http://localhost:${PORT}/milestones`);
    console.log(`Subject routes will be accessible at:`);
    console.log(`   http://localhost:${PORT}/subjects`);
    console.log(`Topic routes will be accessible at:`);
    console.log(`   http://localhost:${PORT}/topics`);
    console.log(`User routes will be accessible at:`);
    console.log(`   http://localhost:${PORT}/users`);
});
