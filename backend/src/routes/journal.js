/**
 * Journal Routes — /api/journal
 * Users manage their own private journal entries.
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/journal — all entries for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .select('id, title, content, mood, tags, is_private, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stats = {
      total:    (data || []).length,
      thisWeek: (data || []).filter(e => {
        const d = new Date(e.created_at);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }).length,
      avgMood: (data || []).length
        ? parseFloat(((data || []).reduce((a, e) => a + (e.mood || 5), 0) / (data || []).length).toFixed(1))
        : 0,
      streak: calcStreak(data || []),
    };

    res.json({ entries: data || [], stats });
  } catch (err) { next(err); }
});

// GET /api/journal/:id — single entry (owner only)
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Entry not found' });
    res.json({ entry: data });
  } catch (err) { next(err); }
});

// POST /api/journal — create entry
router.post('/',
  [
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('mood').optional().isInt({ min: 1, max: 5 }).toInt(),
    body('title').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, content, mood, tags, is_private = true } = req.body;

      const { data, error } = await supabaseAdmin
        .from('journal_entries')
        .insert({
          user_id:    req.user.id,
          title:      title?.trim() || null,
          content:    content.trim(),
          mood:       mood || null,
          tags:       tags || [],
          is_private,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ message: 'Entry saved', entry: data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/journal/:id — update entry
router.patch('/:id', async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('journal_entries').select('id, user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== req.user.id)
      return res.status(404).json({ error: 'Entry not found' });

    const updates = {};
    if (req.body.title      !== undefined) updates.title      = req.body.title?.trim() || null;
    if (req.body.content    !== undefined) updates.content    = req.body.content.trim();
    if (req.body.mood       !== undefined) updates.mood       = req.body.mood;
    if (req.body.tags       !== undefined) updates.tags       = req.body.tags;
    if (req.body.is_private !== undefined) updates.is_private = req.body.is_private;

    const { data, error } = await supabaseAdmin
      .from('journal_entries').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json({ message: 'Entry updated', entry: data });
  } catch (err) { next(err); }
});

// DELETE /api/journal/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('journal_entries').select('id, user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== req.user.id)
      return res.status(404).json({ error: 'Entry not found' });

    await supabaseAdmin.from('journal_entries').delete().eq('id', req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) { next(err); }
});

// Helper: calculate current writing streak (consecutive days)
function calcStreak(entries) {
  if (!entries.length) return 0;
  const days = new Set(entries.map(e => new Date(e.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

module.exports = router;
