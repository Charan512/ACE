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

// Route imports (activated progressively per phase)
import paymentRoutes from './routes/payment.routes.js';
import certRoutes from './routes/certificate.routes.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

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
// CRITICAL: Webhook route needs the raw Buffer to verify HMAC SHA256.
// This MUST be registered BEFORE express.json() consumes the body.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
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
  console.error('💥 UNEXPECTED ERROR:', err);
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
      console.log(`\n✅ ACE ERP Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
