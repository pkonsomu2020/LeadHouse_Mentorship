const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── Helper: sign JWT ──────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Helper: resolve which table a user belongs to ─────────────────
// Returns { table, data } or null
async function findUserByEmail(email) {
  // Check users (mentees)
  const { data: u } = await supabaseAdmin
    .from('users').select('id, username, role, email').eq('email', email).maybeSingle();
  if (u) return { table: 'users', data: u };

  // Check mentors
  const { data: m } = await supabaseAdmin
    .from('mentors').select('profile_id as id, display_name as username, email')
    .eq('email', email).maybeSingle();
  if (m) return { table: 'mentors', data: { ...m, role: 'mentor' } };

  // Check profiles (admins)
  const { data: p } = await supabaseAdmin
    .from('profiles').select('id, username, role, email').eq('email', email).maybeSingle();
  if (p) return { table: 'profiles', data: p };

  return null;
}

// ─────────────────────────────────────────
// POST /api/auth/register
// role = 'mentee' → users table
// role = 'mentor' → mentors table
// ─────────────────────────────────────────
router.post('/register',
  [
    body('email').isEmail().normalizeEmail().trim(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('username')
      .isLength({ min: 3, max: 30 }).trim()
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    body('role').optional().isIn(['mentee', 'mentor']),
    body('county').optional().trim().escape(),
    body('age_group').optional().trim(),
    body('interests').optional().isArray({ max: 20 }),
    body('parent_name').optional().trim().escape(),
    body('parent_email').optional().isEmail().normalizeEmail(),
    body('parent_phone').optional().trim().escape(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, username, role = 'mentee', county, age_group, interests,
            field, bio } = req.body;

    try {
      // Check username uniqueness across both tables
      const [{ data: uExist }, { data: mExist }] = await Promise.all([
        supabaseAdmin.from('users').select('id').eq('username', username).maybeSingle(),
        supabaseAdmin.from('mentors').select('id').eq('display_name', username).maybeSingle(),
      ]);
      if (uExist || mExist) return res.status(409).json({ error: 'Username already taken' });

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (authError) throw authError;

      const userId = authData.user.id;

      if (role === 'mentor') {
        // Insert into mentors table
        const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const { error: mentorErr } = await supabaseAdmin.from('mentors').insert({
          profile_id:      userId,
          display_name:    username,
          email,
          field:           field || 'General',
          county:          county || null,
          bio:             bio || null,
          avatar_initials: initials,
          is_verified:     false,   // admin must verify
          is_available:    false,
          is_active:       true,
          rating:          0,
          total_sessions:  0,
        });
        if (mentorErr) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw mentorErr;
        }
      } else {
        // Insert into users table (mentee)
        const { parent_name, parent_email, parent_phone, parent_consent } = req.body;
        const isMinor = age_group === '15-17';

        const { error: userErr } = await supabaseAdmin.from('users').insert({
          id:             userId,
          email,
          username,
          role:           'mentee',
          county:         county    || null,
          age_group:      age_group || null,
          interests:      interests || [],
          is_minor:       isMinor,
          // Parental consent fields — only stored for minors
          parent_name:    isMinor ? (parent_name    || null) : null,
          parent_email:   isMinor ? (parent_email   || null) : null,
          parent_phone:   isMinor ? (parent_phone   || null) : null,
          parent_consent: isMinor ? (parent_consent || false) : false,
        });
        if (userErr) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw userErr;
        }

        // Welcome notification (non-critical — don't let it fail registration)
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            type:    'system',
            title:   'Welcome to LeadHouse! 🦅',
            body:    `Hi ${username}! Your account is ready. Start by finding a mentor or setting your first goal.`,
          });
        } catch (_) { /* ignore */ }
      }

      const token = signToken({ id: userId, email, role, username });
      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: { id: userId, email, username, role },
      });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────
// POST /api/auth/login
// Works for mentees (users), mentors, and admins (profiles)
// ─────────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      // Authenticate via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid email or password' });

      // Find which table this user belongs to
      const found = await findUserByEmail(email);
      if (!found) return res.status(404).json({ error: 'Account not found' });

      const { table, data: profile } = found;

      // Admins should use the admin dashboard login, not this endpoint
      if (table === 'profiles' && profile.role === 'admin') {
        return res.status(403).json({ error: 'Please use the admin dashboard to sign in.' });
      }

      const token = signToken({
        id:       profile.id,
        email:    profile.email,
        role:     profile.role,
        username: profile.username,
      });

      res.json({
        message: 'Login successful',
        token,
        user: { id: profile.id, email: profile.email, username: profile.username, role: profile.role },
      });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const table = req.user.role === 'mentor' ? 'mentors' : 'users';
    const idCol = req.user.role === 'mentor' ? 'profile_id' : 'id';

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq(idCol, req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
