/**
 * User Settings Routes — /api/settings
 * Handles mentees (users table) and mentors (mentors table).
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate, userTable } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const DEFAULT_PREFS = { messages: true, sessions: true, goals: true, community: true, challenges: true, journal: false, platform: false };

// GET /api/settings/profile
router.get('/profile', async (req, res, next) => {
  try {
    const { table, idCol } = userTable(req.user);

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq(idCol, req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Profile not found' });

    // Compute stats
    const uid = req.user.id;
    const [{ count: sessions }, { count: goals }, { count: challenges }] = await Promise.all([
      supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true })
        .eq('mentee_id', uid).eq('status', 'completed'),
      supabaseAdmin.from('goals').select('*', { count: 'exact', head: true })
        .eq('user_id', uid).eq('is_complete', true),
      supabaseAdmin.from('challenge_participants').select('*', { count: 'exact', head: true })
        .eq('user_id', uid).not('completed_at', 'is', null),
    ]);

    // Journal streak (mentees only)
    let streak = 0;
    if (req.user.role === 'mentee') {
      const { data: journalDays } = await supabaseAdmin
        .from('journal_entries').select('created_at').eq('user_id', uid);
      const daySet = new Set((journalDays || []).map(e => new Date(e.created_at).toDateString()));
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        if (daySet.has(d.toDateString())) streak++;
        else if (i > 0) break;
      }
    }

    // Normalise field names across tables
    const profile = {
      id:               data.id || data.profile_id,
      username:         data.username || data.display_name,
      email:            data.email,
      bio:              data.bio,
      county:           data.county,
      age_group:        data.age_group,
      interests:        data.interests || data.tags || [],
      role:             req.user.role,
      notificationPrefs: data.notification_prefs || DEFAULT_PREFS,
      // mentor-specific
      field:            data.field,
      rating:           data.rating,
      totalSessions:    data.total_sessions,
      isVerified:       data.is_verified,
    };

    res.json({
      profile,
      stats: {
        daysActive:       streak,
        goalsCompleted:   goals     || 0,
        badgesEarned:     challenges || 0,
        sessionsAttended: sessions  || 0,
      },
    });
  } catch (err) { next(err); }
});

// PATCH /api/settings/profile
router.patch('/profile',
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('bio').optional().trim(),
    body('county').optional().trim(),
    body('age_group').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { table, idCol } = userTable(req.user);

      // Map field names per table
      const fieldMap = {
        users:   { username: 'username', bio: 'bio', county: 'county', age_group: 'age_group', interests: 'interests' },
        mentors: { username: 'display_name', bio: 'bio', county: 'county', interests: 'tags' },
        profiles:{ username: 'username', bio: 'bio', county: 'county' },
      };
      const map = fieldMap[table] || fieldMap.users;

      const updates = {};
      for (const [key, col] of Object.entries(map)) {
        if (req.body[key] !== undefined) updates[col] = req.body[key];
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

      // Username uniqueness check
      const newUsername = req.body.username;
      if (newUsername) {
        const [{ data: u }, { data: m }] = await Promise.all([
          supabaseAdmin.from('users').select('id').eq('username', newUsername).neq('id', req.user.id).maybeSingle(),
          supabaseAdmin.from('mentors').select('id').eq('display_name', newUsername).maybeSingle(),
        ]);
        if (u || m) return res.status(409).json({ error: 'Username already taken' });
      }

      const { data, error } = await supabaseAdmin
        .from(table).update(updates).eq(idCol, req.user.id).select().single();

      if (error) throw error;

      if (newUsername) localStorage?.setItem?.('lh_username', newUsername); // client-side only
      res.json({ message: 'Profile updated', profile: data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/settings/notifications
router.patch('/notifications', async (req, res, next) => {
  try {
    const { table, idCol } = userTable(req.user);
    const { prefs } = req.body;
    if (!prefs || typeof prefs !== 'object') return res.status(400).json({ error: 'Invalid preferences' });

    const { error } = await supabaseAdmin
      .from(table).update({ notification_prefs: prefs }).eq(idCol, req.user.id);

    if (error) throw error;
    res.json({ message: 'Notification preferences saved' });
  } catch (err) { next(err); }
});

// PATCH /api/settings/password
router.patch('/password',
  [body('newPassword').isLength({ min: 6 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: req.body.newPassword,
      });
      if (error) throw error;
      res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
