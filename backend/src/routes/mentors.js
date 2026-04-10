const express = require('express');
const { query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/mentors/my-requests
// Returns the logged-in user's match request statuses
// keyed by mentor_id — so the frontend can show correct button state
// ─────────────────────────────────────────
router.get('/my-requests', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .select('mentor_id, status')
      .eq('mentee_id', req.user.id);

    if (error) throw error;

    // Return as { [mentorId]: status }
    const statusMap = {};
    (data || []).forEach(r => { statusMap[r.mentor_id] = r.status; });

    res.json({ requests: statusMap });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/mentors
// List mentors with optional filters & search
// Public endpoint — no auth required
// ─────────────────────────────────────────
router.get(
  '/',
  [
    query('search').optional().isString().trim(),
    query('field').optional().isString().trim(),
    query('county').optional().isString().trim(),
    query('available').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { search, field, county, available, limit = 50, offset = 0 } = req.query;

      let queryBuilder = supabaseAdmin
        .from('mentors')
        .select(`
          id,
          display_name,
          field,
          county,
          lat,
          lng,
          bio,
          tags,
          avatar_initials,
          rating,
          total_sessions,
          is_verified,
          is_available
        `)
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .range(offset, offset + limit - 1);

      if (field && field !== 'all') {
        queryBuilder = queryBuilder.ilike('field', `%${field}%`);
      }

      if (county && county !== 'all') {
        queryBuilder = queryBuilder.ilike('county', `%${county}%`);
      }

      if (available !== undefined) {
        queryBuilder = queryBuilder.eq('is_available', available === 'true');
      }

      if (search) {
        queryBuilder = queryBuilder.or(
          `display_name.ilike.%${search}%,field.ilike.%${search}%,bio.ilike.%${search}%`
        );
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      // Shape response to match frontend MentorLocation interface
      const mentors = (data || []).map((m) => ({
        id:       m.id,
        name:     m.display_name,
        field:    m.field,
        county:   m.county,
        lat:      m.lat,
        lng:      m.lng,
        bio:      m.bio,
        tags:     m.tags || [],
        avatar:   m.avatar_initials,
        rating:   parseFloat(m.rating) || 0,
        sessions: m.total_sessions || 0,
        isVerified:   m.is_verified,
        isAvailable:  m.is_available,
      }));

      res.json({ mentors, total: mentors.length });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────
// DELETE /api/mentors/:id/cancel-match
// Mentee cancels their own match request or accepted match
// ─────────────────────────────────────────
router.delete('/:id/cancel-match', authenticate, async (req, res, next) => {
  try {
    const mentorId = req.params.id;
    const menteeId = req.user.id;

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('match_requests')
      .select('id, status')
      .eq('mentee_id', menteeId)
      .eq('mentor_id', mentorId)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'No match request found' });
    }

    if (!['pending', 'accepted'].includes(existing.status)) {
      return res.status(400).json({ error: 'This match cannot be cancelled' });
    }

    const { error } = await supabaseAdmin
      .from('match_requests')
      .update({ status: 'cancelled' })
      .eq('id', existing.id);

    if (error) throw error;

    res.json({ message: 'Match cancelled successfully' });
  } catch (err) {
    next(err);
  }
});// Get a single mentor's full profile
// ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentors')
      .select(`
        *,
        mentor_reviews (
          rating,
          review,
          created_at,
          mentee:users!mentee_id ( username )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Mentor not found' });

    res.json({
      id:           data.id,
      name:         data.display_name,
      field:        data.field,
      county:       data.county,
      lat:          data.lat,
      lng:          data.lng,
      bio:          data.bio,
      tags:         data.tags || [],
      avatar:       data.avatar_initials,
      rating:       parseFloat(data.rating) || 0,
      sessions:     data.total_sessions || 0,
      isVerified:   data.is_verified,
      isAvailable:  data.is_available,
      reviews:      data.mentor_reviews || [],
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/mentors/:id/request-match
// Mentee sends a match request to a mentor
// Requires authentication
// ─────────────────────────────────────────
router.post('/:id/request-match', authenticate, async (req, res, next) => {
  try {
    const mentorId = req.params.id;
    const menteeId = req.user.id;
    const { message } = req.body;

    // Verify mentor exists and is available
    const { data: mentor, error: mentorErr } = await supabaseAdmin
      .from('mentors')
      .select('id, is_available, display_name')
      .eq('id', mentorId)
      .single();

    if (mentorErr || !mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (!mentor.is_available) {
      return res.status(400).json({ error: 'This mentor is currently unavailable' });
    }

    // Check for existing pending request
    const { data: existing } = await supabaseAdmin
      .from('match_requests')
      .select('id, status')
      .eq('mentee_id', menteeId)
      .eq('mentor_id', mentorId)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ error: 'You already have a pending request with this mentor' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'You are already matched with this mentor' });
      }
    }

    // Create the match request
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .insert({
        mentee_id: menteeId,
        mentor_id: mentorId,
        message:   message || null,
        status:    'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: `Match request sent to ${mentor.display_name}`,
      request: data,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/mentors/:id/reviews
// Get all reviews for a mentor
// ─────────────────────────────────────────
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_reviews')
      .select(`
        id,
        rating,
        review,
        created_at,
        mentee:users!mentee_id ( username )
      `)
      .eq('mentor_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ reviews: data || [] });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/mentors/:id/reviews
// Mentee submits a review for a mentor
// Requires authentication
// ─────────────────────────────────────────
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabaseAdmin
      .from('mentor_reviews')
      .upsert({
        mentor_id: req.params.id,
        mentee_id: req.user.id,
        rating,
        review: review || null,
      }, { onConflict: 'mentor_id,mentee_id' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Review submitted', review: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
