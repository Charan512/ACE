// ============================================================
// ACE ERP — Server Entry Point
// ============================================================
import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

// ── Worker imports (co-located for single-process Render deployment) ──────────
// BullMQ workers are imported here so they run inside the same Node process as
// Express. On Render's free tier there is only one web service — a separate
// worker process is not available without paying for a Background Worker.
// All workers are async/event-driven and never block the HTTP event loop.
import emailWorker         from './workers/emailWorker.js';
import lateConverterWorker from './workers/lateConverterWorker.js';
import certificateWorker   from './workers/certificateWorker.js';

// Route imports (activated progressively per phase)
import paymentRoutes from './routes/payment.routes.js';
import certRoutes from './routes/certificate.routes.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import opsRoutes from './routes/ops.routes.js';

// ── Production Safety Guards ─────────────────────────────────
// Prevents accidental deployment with a weak development JWT secret.
if (!process.env.JWT_SECRET) {
  console.error('[Server] FATAL: JWT_SECRET is not set in .env. Shutting down.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.toLowerCase().includes('dev') || process.env.JWT_SECRET.toLowerCase().includes('secret'))) {
  console.error('[Server] FATAL: Weak JWT_SECRET detected in production. Shutting down.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// ── Security Middleware ──────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// ── Global Rate Limiter ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// ── Body Parsers ─────────────────────────────────────────────
// PhonePe webhooks are processed using standard JSON payload parsing.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request Logging ──────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'ACE ERP Server is operational.' });
});

// ── Route Registration ───────────────────────────────────────
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/upload', uploadRoutes); // admin/ebm/sbm: posters, certificate templates
app.use('/api/upload', uploadRoutes);        // any authenticated user: avatar uploads
app.use('/api/ops', opsRoutes);

// ── Public Settings Endpoint ─────────────────────────────────
// Returns only public-safe data (membership fee).
// No auth required — used by the self-registration form to show current fee.
app.get('/api/settings/membership-fee', async (_req, res) => {
  try {
    const AppSettings = (await import('./models/AppSettings.js')).default;
    const settings = await AppSettings.getSingleton();
    res.status(200).json({ success: true, data: { membershipFee: settings.membershipFee } });
  } catch {
    res.status(200).json({ success: true, data: { membershipFee: 500 } }); // Safe fallback
  }
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
});

// ── Global Error Handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // In development — full error details for debugging
    console.error(`[ERROR] ${err.message}\n`, err.stack);
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }

  // In production — distinguish operational (safe to expose) vs programming errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Unknown/programming error — log fully, send generic message
  console.error('[Server] UNEXPECTED ERROR:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
});

// ── Start Server ─────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n[Server] ACE ERP running on port ${PORT} [${process.env.NODE_ENV}]`);

      // Start BullMQ workers AFTER the server is listening.
      // They connect to Redis independently — a Redis failure here logs a warning
      // but does NOT crash the HTTP server (non-critical degraded mode).
      try {
        // Workers are already imported above; importing them registers their
        // BullMQ Worker instances. Log confirmation here.
        const workerNames = [
          emailWorker.name         || 'ace-email',
          lateConverterWorker.name || 'ace-late-converter',
          certificateWorker.name   || 'ace-certificates',
        ];
        console.log(`[Workers] Active queues: ${workerNames.join(', ')}`);
      } catch (workerErr) {
        console.error('[Workers] Failed to start — emails & digest will not process:', workerErr.message);
      }

    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

// ── Graceful Shutdown ─────────────────────────────────────────
// Render sends SIGTERM before terminating a service instance.
// Close workers cleanly to avoid leaving jobs in an active/stalled state.
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — graceful shutdown initiated.`);
  await Promise.allSettled([
    emailWorker.close(),
    lateConverterWorker.close(),
    certificateWorker.close(),
  ]);
  console.log('[Workers] All workers closed.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
