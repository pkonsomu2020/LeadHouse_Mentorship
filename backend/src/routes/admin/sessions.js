/**
 * Admin Sessions Routes — /api/admin/sessions
 * Admin books sessions; users view and join them.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// ─────────────────────────────────────────
// GET /api/admin/sessions
// All sessions platform-wide + stats
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    let q = supabaseAdmin
      .from('sessions')
      .select(`
        id, topic, scheduled_at, duration_min, status, notes,
        meeting_link, booked_by, created_at, mentee_id,
        mentor:mentors ( id, display_name, field, avatar_initials )
      `)
      .order('scheduled_at', { ascending: false });

    if (status && status !== 'all') q = q.eq('status', status);

    let { data, error } = await q;

    // Fallback if new columns don't exist yet
    if (error && error.message && error.message.includes('does not exist')) {
      const fallback = await supabaseAdmin
        .from('sessions')
        .select(`
          id, topic, scheduled_at, duration_min, status, notes, created_at, mentee_id,
          mentor:mentors ( id, display_name, field, avatar_initials )
        `)
        .order('scheduled_at', { ascending: false });
      data  = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const sessions = (data || []).map(s => ({
      id:           s.id,
      topic:        s.topic,
      scheduledAt:  s.scheduled_at,
      durationMin:  s.duration_min,
      status:       s.status,
      notes:        s.notes,
      meetingLink:  s.meeting_link || null,
      bookedBy:     s.booked_by || 'admin',
      mentor:       s.mentor?.display_name || 'Unknown',
      mentorId:     s.mentor?.id,
      mentorField:  s.mentor?.field || '',
      mentorAvatar: s.mentor?.avatar_initials || '??',
      menteeId:     s.mentee_id,
    }));
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = {
      total:     sessions.length,
      upcoming:  sessions.filter(s => s.status === 'scheduled').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      thisMonth: sessions.filter(s => new Date(s.scheduledAt) >= monthStart).length,
    };

    res.json({ sessions, stats });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// GET /api/admin/sessions/matches
// All accepted matches (for mentee+mentor dropdowns when booking)
// ─────────────────────────────────────────
router.get('/matches', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .select(`
        id, mentee_id, mentee_username,
        mentor:mentors ( id, display_name, field, avatar_initials )
      `)
      .eq('status', 'accepted');

    if (error) throw error;

    res.json({ matches: data || [] });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /api/admin/sessions
// Admin books a session for a mentee+mentor pair
// ─────────────────────────────────────────
router.post('/',
  [
    body('mentorId').notEmpty().withMessage('Mentor is required'),
    body('menteeId').notEmpty().withMessage('Mentee is required'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('scheduledAt').isISO8601().withMessage('Valid date/time is required'),
    body('durationMin').optional().isInt({ min: 15, max: 180 }).toInt(),
    body('meetingLink').optional().isURL().withMessage('Meeting link must be a valid URL'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { mentorId, menteeId, topic, scheduledAt, durationMin = 60, meetingLink, notes } = req.body;

      // Verify the mentee is matched with this mentor
      const { data: match } = await supabaseAdmin
        .from('match_requests')
        .select('id')
        .eq('mentee_id', menteeId)
        .eq('mentor_id', mentorId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!match) {
        return res.status(400).json({ error: 'This mentee is not matched with the selected mentor' });
      }

      const { data, error } = await supabaseAdmin
        .from('sessions')
        .insert({
          mentee_id:    menteeId,
          mentor_id:    mentorId,
          topic:        topic.trim(),
          scheduled_at: scheduledAt,
          duration_min: durationMin,
          status:       'scheduled',
          meeting_link: meetingLink || null,
          notes:        notes || null,
          booked_by:    'admin',
        })
        .select(`
          id, topic, scheduled_at, duration_min, status, meeting_link,
          mentor:mentors ( display_name )
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        message: `Session "${topic}" booked successfully`,
        session: data,
      });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────
// PATCH /api/admin/sessions/:id/status
// Admin updates session status + optional notes/meeting link
// ─────────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, notes, meetingLink } = req.body;
    const allowed = ['scheduled', 'completed', 'cancelled', 'no_show'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const updates = { status };
    if (notes       !== undefined) updates.notes        = notes;
    if (meetingLink !== undefined) updates.meeting_link = meetingLink;

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (status === 'completed' && data.mentor_id) {
      await supabaseAdmin
        .from('mentors')
        .update({ total_sessions: supabaseAdmin.rpc('increment_mentor_sessions', { mentor_id: data.mentor_id }) })
        .eq('id', data.mentor_id)
        .catch(() => {});
    }

    res.json({ message: `Session marked as ${status}`, session: data });
  } catch (err) { next(err); }
});

module.exports = router;
