require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes           = require('./routes/auth');
const mentorRoutes         = require('./routes/mentors');
const sessionRoutes        = require('./routes/sessions');
const goalRoutes           = require('./routes/goals');
const messageRoutes        = require('./routes/messages');
const journalRoutes        = require('./routes/journal');
const resourceRoutes       = require('./routes/resources');
const challengeRoutes      = require('./routes/challenges');
const adminMatchRoutes     = require('./routes/admin/matching');
const adminAuthRoutes      = require('./routes/admin/auth');
const adminSessionRoutes   = require('./routes/admin/sessions');
const adminGoalRoutes      = require('./routes/admin/goals');
const adminJournalRoutes   = require('./routes/admin/journal');
const adminResourceRoutes  = require('./routes/admin/resources');
const communityRoutes      = require('./routes/community');
const reportRoutes         = require('./routes/reports');
const dashboardRoutes      = require('./routes/dashboard');
const searchRoutes         = require('./routes/search');
const notificationRoutes   = require('./routes/notifications');
const settingsRoutes       = require('./routes/settings');
const adminChallengeRoutes = require('./routes/admin/challenges');
const adminCommunityRoutes = require('./routes/admin/community');
const adminReportRoutes    = require('./routes/admin/reports');
const adminOverviewRoutes  = require('./routes/admin/overview');
const adminSettingsRoutes  = require('./routes/admin/settings');
const adminUsersRoutes     = require('./routes/admin/users');
const adminSearchRoutes    = require('./routes/admin/search');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────
// Security Headers (Helmet)
// ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'", "https://*.supabase.co"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Supabase storage
}));

// ─────────────────────────────────────────
// CORS
// ─────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────
// Body parsing — strict limits
// ─────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));          // reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────
// General API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProd && req.ip === '::1', // skip localhost in dev
});

// Strict limit for auth endpoints — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // only 10 login attempts per 15 min per IP
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limit
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many uploads. Please wait a moment.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login',        authLimiter);
app.use('/api/auth/register',     authLimiter);
app.use('/api/admin/auth/login',  authLimiter);
app.use('/api/messages/upload',   uploadLimiter);
app.use('/api/resources/upload',  uploadLimiter);

// ─────────────────────────────────────────
// Health Check — minimal info in production
// ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LeadHouse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    // Never expose internal URLs in production
    ...(isProd ? {} : { env: process.env.NODE_ENV }),
  });
});

// ─────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────
app.use('/api/auth',              authRoutes);
app.use('/api/mentors',           mentorRoutes);
app.use('/api/sessions',          sessionRoutes);
app.use('/api/goals',             goalRoutes);
app.use('/api/messages',          messageRoutes);
app.use('/api/journal',           journalRoutes);
app.use('/api/resources',         resourceRoutes);
app.use('/api/challenges',        challengeRoutes);
app.use('/api/community',         communityRoutes);
app.use('/api/reports',           reportRoutes);
app.use('/api/dashboard',         dashboardRoutes);
app.use('/api/search',            searchRoutes);
app.use('/api/notifications',     notificationRoutes);
app.use('/api/settings',          settingsRoutes);
app.use('/api/admin/auth',        adminAuthRoutes);
app.use('/api/admin/matching',    adminMatchRoutes);
app.use('/api/admin/sessions',    adminSessionRoutes);
app.use('/api/admin/goals',       adminGoalRoutes);
app.use('/api/admin/journal',     adminJournalRoutes);
app.use('/api/admin/resources',   adminResourceRoutes);
app.use('/api/admin/challenges',  adminChallengeRoutes);
app.use('/api/admin/community',   adminCommunityRoutes);
app.use('/api/admin/reports',     adminReportRoutes);
app.use('/api/admin/overview',    adminOverviewRoutes);
app.use('/api/admin/settings',    adminSettingsRoutes);
app.use('/api/admin/users',       adminUsersRoutes);
app.use('/api/admin/search',      adminSearchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' }); // don't expose route details
});

// Global error handler
app.use(errorHandler);

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 LeadHouse API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
