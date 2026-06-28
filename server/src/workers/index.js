import 'dotenv/config';
import connectDB from '../config/db.js';

// Import workers to instantiate them and start processing jobs
import './emailWorker.js';
import './treasurerWorker.js';
import './lateConverterWorker.js';
import './certificateWorker.js';

/**
 * ACE ERP — Background Worker Entry Point
 *
 * This file is meant to be run as a separate Node process (e.g. `node src/workers/index.js`)
 * in production. BullMQ workers should not share the Express event loop to prevent
 * CPU-heavy or long-running jobs from blocking HTTP requests.
 */

const startWorkers = async () => {
  try {
    // Workers often need DB access (e.g. fetching User/Transaction, updating MongoDB)
    await connectDB();
    console.log('\n[Workers] Background workers started successfully.');
    console.log('Listening to: ace-email, ace-treasurer, ace-late-converter, ace-certificates');
  } catch (error) {
    console.error('[Workers] Failed to start:', error.message);
    process.exit(1);
  }
};

startWorkers();

// Graceful shutdown handling
const shutdown = () => {
  console.log('\n[Workers] Shutting down...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
