/**
 * Sessions Routes
 * Base: /api/sessions
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─────────────────────────────────────────
// GET /api/sessions/my-mentors
// Returns mentors the user is matched with (accepted requests)
// Used to populate the "Book Session" mentor dropdown
// ─────────────────────────────────────────
router.get('/my-mentors', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .select('mentor:mentors ( id, display_name, field, avatar_initials )')
      .eq('mentee_id', req.user.id)
      .eq('status', 'accepted');

    if (error) throw error;

    const mentors = (data || [])
      .map(r => r.mentor)
      .filter(Boolean);

    res.json({ mentors });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// GET /api/sessions
// Get all sessions for the logged-in user
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, topic, scheduled_at, duration_min, status, notes,
        meeting_link, booked_by, created_at,
        mentor:mentors ( id, display_name, field, avatar_initials )
      `)
      .eq('mentee_id', req.user.id)
      .order('scheduled_at', { ascending: false });

    // If meeting_link/booked_by columns don't exist yet, retry without them
    if (error && error.message && error.message.includes('does not exist')) {
      const fallback = await supabaseAdmin
        .from('sessions')
        .select(`
          id, topic, scheduled_at, duration_min, status, notes, created_at,
          mentor:mentors ( id, display_name, field, avatar_initials )
        `)
        .eq('mentee_id', req.user.id)
        .order('scheduled_at', { ascending: false });
      
      if (fallback.error) throw fallback.error;

      const sessions = (fallback.data || []).map(s => ({
        id:           s.id,
        topic:        s.topic,
        scheduledAt:  s.scheduled_at,
        durationMin:  s.duration_min,
        status:       s.status,
        notes:        s.notes,
        meetingLink:  null,
        bookedBy:     'admin',
        mentor:       s.mentor?.display_name || 'Unknown',
        mentorId:     s.mentor?.id || null,
        mentorField:  s.mentor?.field || '',
        mentorAvatar: s.mentor?.avatar_initials || '??',
      }));

      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const stats = {
        total:     sessions.length,
        upcoming:  sessions.filter(s => s.status === 'scheduled').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        thisMonth: sessions.filter(s => new Date(s.scheduledAt) >= monthStart).length,
      };

      return res.json({ sessions, stats });
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
      mentorId:     s.mentor?.id || null,
      mentorField:  s.mentor?.field || '',
      mentorAvatar: s.mentor?.avatar_initials || '??',
    }));

    // Compute stats
    const now       = new Date();
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
// POST /api/sessions
// Book a new session
// ─────────────────────────────────────────
router.post('/',
  [
    body('mentorId').notEmpty().withMessage('Mentor is required'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('scheduledAt').isISO8601().withMessage('Valid date/time is required'),
    body('durationMin').optional().isInt({ min: 15, max: 180 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { mentorId, topic, scheduledAt, durationMin = 60 } = req.body;

      // Verify the user is matched with this mentor
      const { data: match } = await supabaseAdmin
        .from('match_requests')
        .select('id')
        .eq('mentee_id', req.user.id)
        .eq('mentor_id', mentorId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!match) {
        return res.status(403).json({ error: 'You can only book sessions with your matched mentor' });
      }

      // Check for scheduling conflicts (same mentor, overlapping time)
      const sessionTime = new Date(scheduledAt);
      const windowEnd   = new Date(sessionTime.getTime() + durationMin * 60000);

      const { data: conflicts } = await supabaseAdmin
        .from('sessions')
        .select('id, scheduled_at')
        .eq('mentor_id', mentorId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', sessionTime.toISOString())
        .lt('scheduled_at', windowEnd.toISOString());

      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ error: 'This time slot is already booked. Please choose a different time.' });
      }

      const { data, error } = await supabaseAdmin
        .from('sessions')
        .insert({
          mentee_id:    req.user.id,
          mentor_id:    mentorId,
          topic:        topic.trim(),
          scheduled_at: scheduledAt,
          duration_min: durationMin,
          status:       'scheduled',
        })
        .select(`
          id, topic, scheduled_at, duration_min, status,
          mentor:mentors ( id, display_name, field, avatar_initials )
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        message: `Session "${topic}" booked successfully`,
        session: {
          id:           data.id,
          topic:        data.topic,
          scheduledAt:  data.scheduled_at,
          durationMin:  data.duration_min,
          status:       data.status,
          mentor:       data.mentor?.display_name,
          mentorAvatar: data.mentor?.avatar_initials,
        },
      });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────
// PATCH /api/sessions/:id/cancel
// Mentee cancels an upcoming session
// ─────────────────────────────────────────
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('id, status, mentee_id')
      .eq('id', req.params.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.mentee_id !== req.user.id) return res.status(403).json({ error: 'Not your session' });
    if (session.status !== 'scheduled') return res.status(400).json({ error: 'Only scheduled sessions can be cancelled' });

    const { error } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Session cancelled' });
  } catch (err) { next(err); }
});

module.exports = router;
