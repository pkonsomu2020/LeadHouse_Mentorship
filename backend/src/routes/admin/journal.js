/**
 * Admin Journal Routes — /api/admin/journal
 * Admins see metadata (title, mood, tags) but NOT content (privacy).
 * Can flag entries for wellbeing follow-up.
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/journal — all entries (metadata only, no content)
router.get('/', async (req, res, next) => {
  try {
    const { mood, flagged, search } = req.query;

    let q = supabaseAdmin
      .from('journal_entries')
      .select(`
        id, title, mood, tags, is_private, created_at,
        user:users!user_id ( id, username )
      `)
      .order('created_at', { ascending: false });

    if (mood && mood !== 'all') q = q.eq('mood', parseInt(mood));
    if (flagged === 'true')     q = q.eq('is_private', false); // flagged = shared with admin
    if (search) q = q.ilike('title', `%${search}%`);

    const { data, error } = await q;
    if (error) throw error;

    const entries = (data || []).map(e => ({
      id:        e.id,
      title:     e.title || 'Untitled',
      mood:      e.mood,
      moodLabel: moodLabel(e.mood),
      tags:      e.tags || [],
      isFlagged: !e.is_private,   // is_private=false means user shared/flagged for admin
      createdAt: e.created_at,
      userId:    e.user?.id,
      username:  e.user?.username || 'Unknown',
    }));

    // Mood distribution
    const moodDist = [1, 2, 3, 4, 5].map(m => ({
      mood:  moodLabel(m),
      count: entries.filter(e => e.mood === m).length,
    }));

    // Weekly mood trend (last 4 weeks)
    const now = new Date();
    const weeklyTrend = [3, 2, 1, 0].map(weeksAgo => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (weeksAgo + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
      const weekEntries = entries.filter(e => {
        const d = new Date(e.createdAt);
        return d >= weekStart && d < weekEnd && e.mood;
      });
      const avg = weekEntries.length
        ? parseFloat((weekEntries.reduce((a, e) => a + e.mood, 0) / weekEntries.length).toFixed(1))
        : null;
      return { week: `W${4 - weeksAgo}`, avg };
    });

    const stats = {
      total:      entries.length,
      flagged:    entries.filter(e => e.isFlagged).length,
      struggling: entries.filter(e => e.mood <= 2).length,
      avgMood:    entries.filter(e => e.mood).length
        ? parseFloat((entries.filter(e => e.mood).reduce((a, e) => a + e.mood, 0) / entries.filter(e => e.mood).length).toFixed(1))
        : 0,
    };

    res.json({ entries, stats, moodDist, weeklyTrend });
  } catch (err) { next(err); }
});

// PATCH /api/admin/journal/:id/flag
// Toggle is_private=false (flagged for admin attention)
router.patch('/:id/flag', async (req, res, next) => {
  try {
    const { flagged } = req.body; // true = flag, false = clear flag

    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .update({ is_private: !flagged })
      .eq('id', req.params.id)
      .select('id, is_private')
      .single();

    if (error) throw error;
    res.json({ message: flagged ? 'Entry flagged for follow-up' : 'Flag cleared', entry: data });
  } catch (err) { next(err); }
});

function moodLabel(mood) {
  const labels = { 1: 'Struggling', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
  return labels[mood] || 'Unknown';
}

module.exports = router;
