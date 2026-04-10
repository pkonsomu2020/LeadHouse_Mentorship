/**
 * Admin Mentor Matching Routes
 * Base: /api/admin/matching
 * All routes require authentication + admin role
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Apply auth + admin guard to all routes in this file
router.use(authenticate, requireRole('admin'));

// ─────────────────────────────────────────
// GET /api/admin/matching/stats
// Summary stats for the matching dashboard
// ─────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [
      { count: active },
      { count: pending },
      { count: ended },
      { data: sessionData },
    ] = await Promise.all([
      supabaseAdmin.from('match_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabaseAdmin.from('match_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('match_requests').select('*', { count: 'exact', head: true }).in('status', ['declined', 'cancelled']),
      supabaseAdmin.from('sessions').select('id').eq('status', 'completed'),
    ]);

    const totalSessions = sessionData?.length || 0;
    const avgSessions   = active > 0 ? (totalSessions / active).toFixed(1) : '0';

    res.json({
      activeMatches:   active  || 0,
      pendingRequests: pending || 0,
      endedMatches:    ended   || 0,
      avgSessionsPerMatch: parseFloat(avgSessions),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/admin/matching/requests
// All match requests (pending first)
// ─────────────────────────────────────────
router.get('/requests', async (req, res, next) => {
  try {
    const { status } = req.query;

    // Select only columns guaranteed to exist.
    // mentee_username / requested_field / preferences are added via migration —
    // if they don't exist yet PostgREST will error, so we catch and retry without them.
    let q = supabaseAdmin
      .from('match_requests')
      .select(`
        id,
        status,
        message,
        mentee_id,
        mentor_id,
        created_at,
        updated_at,
        mentee_username,
        requested_field,
        preferences,
        mentor:mentors ( id, display_name, field, county, avatar_initials )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') q = q.eq('status', status);

    let { data, error } = await q;

    // If the extra columns don't exist yet, retry without them
    if (error && error.message && error.message.includes('does not exist')) {
      const fallback = await supabaseAdmin
        .from('match_requests')
        .select(`
          id, status, message, mentee_id, mentor_id, created_at, updated_at,
          mentor:mentors ( id, display_name, field, county, avatar_initials )
        `)
        .order('created_at', { ascending: false });
      data  = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    // Resolve any missing mentee names from the users table
    const missingReqIds = [...new Set(
      (data || [])
        .filter(r => !r.mentee_username && r.mentee_id)
        .map(r => r.mentee_id)
    )];

    const reqUsernameMap = {};
    if (missingReqIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', missingReqIds);
      (users || []).forEach(u => { reqUsernameMap[u.id] = u.username; });
    }

    // Normalise — fill missing fields with safe defaults
    const requests = (data || []).map(r => ({
      ...r,
      mentee_username: r.mentee_username
        || reqUsernameMap[r.mentee_id]
        || `User-${r.mentee_id?.slice(0, 6) || '?'}`,
      requested_field: r.requested_field || r.mentor?.field || '—',
      preferences:     r.preferences     || '',
    }));

    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/admin/matching/matches
// All matches with session counts
// ─────────────────────────────────────────
router.get('/matches', async (req, res, next) => {
  try {
    let { data, error } = await supabaseAdmin
      .from('match_requests')
      .select(`
        id, status, created_at, updated_at,
        mentee_id, mentee_username,
        mentor:mentors ( id, display_name, field, county, avatar_initials )
      `)
      .order('updated_at', { ascending: false });

    // Retry without mentee_username if column missing
    if (error && error.message && error.message.includes('does not exist')) {
      const fallback = await supabaseAdmin
        .from('match_requests')
        .select(`
          id, status, created_at, updated_at, mentee_id,
          mentor:mentors ( id, display_name, field, county, avatar_initials )
        `)
        .order('updated_at', { ascending: false });
      data  = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    // Resolve any missing mentee names from the users table
    const missingIds = [...new Set(
      (data || [])
        .filter(m => !m.mentee_username && m.mentee_id)
        .map(m => m.mentee_id)
    )];

    const usernameMap = {};
    if (missingIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .in('id', missingIds);
      (users || []).forEach(u => { usernameMap[u.id] = u.username; });
    }

    // Attach session counts per match
    const enriched = await Promise.all((data || []).map(async (match) => {
      let sessionCount = 0;
      if (match.mentor?.id) {
        const { count } = await supabaseAdmin
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('mentor_id', match.mentor.id)
          .eq('status', 'completed');
        sessionCount = count || 0;
      }

      const menteeName = match.mentee_username
        || usernameMap[match.mentee_id]
        || `User-${(match.mentee_id || '').slice(0, 6)}`;

      return {
        id:       match.id,
        mentee:   menteeName,
        mentor:   match.mentor?.display_name || 'Unassigned',
        mentorId: match.mentor?.id || null,
        field:    match.mentor?.field || '—',
        status:   match.status,
        since:    match.updated_at
          ? new Date(match.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : '—',
        sessions: sessionCount,
      };
    }));

    res.json({ matches: enriched });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/admin/matching/mentors
// All verified mentors (for assign dropdown)
// ─────────────────────────────────────────
router.get('/mentors', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentors')
      .select('id, display_name, field, county, avatar_initials, rating, total_sessions, is_available, is_verified, bio, tags, lat, lng')
      .order('rating', { ascending: false });

    if (error) throw error;

    res.json({ mentors: data || [] });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/admin/matching/mentors
// Admin adds a new mentor to the database
// ─────────────────────────────────────────
router.post('/mentors', async (req, res, next) => {
  try {
    const {
      display_name, field, county, bio, tags,
      lat, lng, avatar_initials, is_available = true,
    } = req.body;

    if (!display_name || !field || !county) {
      return res.status(400).json({ error: 'display_name, field, and county are required' });
    }

    // Check for duplicate name
    const { data: existing } = await supabaseAdmin
      .from('mentors')
      .select('id')
      .eq('display_name', display_name)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: `A mentor named "${display_name}" already exists` });
    }

    // Auto-generate avatar initials if not provided
    const initials = avatar_initials ||
      display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const { data, error } = await supabaseAdmin
      .from('mentors')
      .insert({
        display_name,
        field,
        county,
        bio:             bio || null,
        tags:            tags || [],
        lat:             lat || null,
        lng:             lng || null,
        avatar_initials: initials,
        is_available,
        is_verified:     true,
        rating:          0,
        total_sessions:  0,
        // profile_id is intentionally omitted — nullable after migration
      })
      .select()
      .single();

    if (error) {
      // If profile_id is still NOT NULL (migration not yet run), give a clear message
      if (error.message && error.message.includes('profile_id')) {
        return res.status(500).json({
          error: 'Database migration required. Please run RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql in your Supabase SQL Editor first.',
        });
      }
      throw error;
    }

    res.status(201).json({ message: `Mentor "${display_name}" added successfully`, mentor: data });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/matching/mentors/:id
// Admin edits an existing mentor
// ─────────────────────────────────────────
router.patch('/mentors/:id', async (req, res, next) => {
  try {
    const allowed = ['display_name', 'field', 'county', 'bio', 'tags', 'lat', 'lng',
                     'avatar_initials', 'is_available', 'is_verified'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('mentors')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Mentor updated', mentor: data });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// DELETE /api/admin/matching/mentors/:id
// Admin removes a mentor
// ─────────────────────────────────────────
router.delete('/mentors/:id', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('mentors')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Mentor removed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/matching/requests/:id/assign
// Admin assigns a mentor to a pending request
// Body: { mentorId }
// ─────────────────────────────────────────
router.patch('/requests/:id/assign', async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) return res.status(400).json({ error: 'mentorId is required' });

    // Verify mentor exists
    const { data: mentor, error: mErr } = await supabaseAdmin
      .from('mentors')
      .select('id, display_name, is_available')
      .eq('id', mentorId)
      .single();

    if (mErr || !mentor) return res.status(404).json({ error: 'Mentor not found' });
    if (!mentor.is_available) return res.status(400).json({ error: 'Mentor is not available' });

    // Update the request
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .update({ mentor_id: mentorId, status: 'accepted' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Assigned to ${mentor.display_name}`, request: data });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/matching/requests/:id/status
// Admin updates request status (accept/decline/cancel)
// Body: { status: 'accepted' | 'declined' | 'cancelled' }
// ─────────────────────────────────────────
router.patch('/requests/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'declined', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Request ${status}`, request: data });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// DELETE /api/admin/matching/matches/:id/unmatch
// Admin ends an active match
// ─────────────────────────────────────────
router.delete('/matches/:id/unmatch', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('status', 'accepted')
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Active match not found' });
    }

    res.json({ message: 'Match ended successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
