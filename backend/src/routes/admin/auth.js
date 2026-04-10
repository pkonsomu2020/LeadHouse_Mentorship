/**
 * Admin Auth Route
 * POST /api/admin/auth/login
 * Validates admin credentials via Supabase, returns a short-lived JWT.
 * Does NOT return the static ADMIN_API_KEY — that is only for server-to-server use.
 */
const express  = require('express');
const jwt      = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../../config/supabase');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Basic input validation
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Authenticate via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — don't reveal whether email exists
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify the user is an admin in the profiles table
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, email')
      .eq('id', data.user.id)
      .single();

    if (profileErr || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin accounts only.' });
    }

    // Issue a short-lived JWT (4 hours) — NOT the static API key
    const token = jwt.sign(
      { id: profile.id, email: profile.email, role: 'admin', username: profile.username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { role: 'admin', username: profile.username, email: profile.email },
    });
  } catch (err) {
    console.error('[Admin Auth Error]', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
