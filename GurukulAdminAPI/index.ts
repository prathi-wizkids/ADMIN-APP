// index.ts - Main API Entry Point
// Load environment variables from .env file FIRST THING
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express'; // Import NextFunction
import bodyParser from 'body-parser';
import gurukulRoutes from './routes/gururkulRoutes';
import milestoneRoutes from './routes/milestoneRoutes'; // Import new milestone routes
import subjectRoutes from './routes/subjectRoutes'; // Import new subject routes
import topicRoutes from './routes/topicRoutes';     // Import new topic routes
import userRoutes from './routes/userRoutes'; // Import new user routes
import teacherDirectRoutes from './routes/teacherDirectRoutes'; // NEW import
import studentDirectRoutes from './routes/studentDirectRoutes'; // NEW import

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Basic route for testing the server
app.get('/', (req, res) => {
  res.send('Gurukul Admin API is running!');
});

// Use the Gurukul and Gurukul Offerings routes
app.use('/', gurukulRoutes);

// Use the Milestone routes
// We'll mount it at '/milestones'
app.use('/milestones', milestoneRoutes);

// Use the Subject routes
app.use('/subjects', subjectRoutes); // New route for subjects

// Use the Topic routes
app.use('/topics', topicRoutes);     // New route for topics
// Use the User routes
app.use('/users', userRoutes); // New route for users

// --- NEW Direct Teacher and Student Routes ---
app.use('/teachers', teacherDirectRoutes); // Direct teacher management (old way)
app.use('/students', studentDirectRoutes); // Direct student management (old way)


// --- Centralized Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
  console.log(`Direct teacher routes will be accessible at:`);
  console.log(`   http://localhost:${PORT}/teachers`);
  console.log(`Direct Students routes will be accessible at:`);
  console.log(`   http://localhost:${PORT}/students`);



});

