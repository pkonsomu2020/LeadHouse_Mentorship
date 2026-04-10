/**
 * Goals Routes — /api/goals
 * User manages their own goals.
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/goals — all goals for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('goals')
      .select('id, title, description, progress, is_complete, due_date, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const goals = (data || []).map(g => ({
      id:          g.id,
      title:       g.title,
      description: g.description,
      progress:    g.progress,
      isComplete:  g.is_complete,
      dueDate:     g.due_date,
      createdAt:   g.created_at,
    }));

    const stats = {
      total:     goals.length,
      active:    goals.filter(g => !g.isComplete).length,
      completed: goals.filter(g => g.isComplete).length,
      avgProgress: goals.length
        ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
        : 0,
    };

    res.json({ goals, stats });
  } catch (err) { next(err); }
});

// POST /api/goals — create a new goal
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('progress').optional().isInt({ min: 0, max: 100 }).toInt(),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description, progress = 0, dueDate } = req.body;

      const { data, error } = await supabaseAdmin
        .from('goals')
        .insert({
          user_id:     req.user.id,
          title:       title.trim(),
          description: description?.trim() || null,
          progress,
          is_complete: progress === 100,
          due_date:    dueDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ message: 'Goal created', goal: data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/goals/:id — update progress, title, or mark complete
router.patch('/:id',
  [
    body('progress').optional().isInt({ min: 0, max: 100 }).toInt(),
    body('title').optional().trim().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from('goals').select('id, user_id').eq('id', req.params.id).single();
      if (!existing || existing.user_id !== req.user.id)
        return res.status(404).json({ error: 'Goal not found' });

      const allowed = ['title', 'description', 'progress', 'due_date'];
      const updates = {};
      if (req.body.title       !== undefined) updates.title       = req.body.title.trim();
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.progress    !== undefined) {
        updates.progress    = req.body.progress;
        updates.is_complete = req.body.progress === 100;
      }
      if (req.body.dueDate     !== undefined) updates.due_date    = req.body.dueDate;
      if (req.body.isComplete  !== undefined) updates.is_complete = req.body.isComplete;

      const { data, error } = await supabaseAdmin
        .from('goals').update(updates).eq('id', req.params.id).select().single();

      if (error) throw error;
      res.json({ message: 'Goal updated', goal: data });
    } catch (err) { next(err); }
  }
);

// DELETE /api/goals/:id — delete a goal
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('goals').select('id, user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== req.user.id)
      return res.status(404).json({ error: 'Goal not found' });

    const { error } = await supabaseAdmin.from('goals').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Goal deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
