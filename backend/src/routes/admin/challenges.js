/**
 * Admin Challenges Routes — /api/admin/challenges
 * Full CRUD for challenges + tasks.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/challenges — all challenges with stats
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let q = supabaseAdmin
      .from('challenges')
      .select(`
        id, title, description, category, status,
        start_date, end_date, reward_badge, points_reward, created_at,
        tasks:challenge_tasks ( id, title, order_index )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') q = q.eq('status', status);
    if (search) q = q.ilike('title', `%${search}%`);

    const { data: challenges, error } = await q;
    if (error) throw error;

    // Participant counts
    const { data: participantData } = await supabaseAdmin
      .from('challenge_participants').select('challenge_id, score, completed_at');

    const countMap = {};
    const completionMap = {};
    (participantData || []).forEach(p => {
      countMap[p.challenge_id] = (countMap[p.challenge_id] || 0) + 1;
      if (p.completed_at) completionMap[p.challenge_id] = (completionMap[p.challenge_id] || 0) + 1;
    });

    const enriched = (challenges || []).map(c => ({
      id:             c.id,
      title:          c.title,
      description:    c.description,
      category:       c.category,
      status:         c.status,
      startDate:      c.start_date,
      endDate:        c.end_date,
      rewardBadge:    c.reward_badge,
      pointsReward:   c.points_reward,
      tasks:          (c.tasks || []).sort((a, b) => a.order_index - b.order_index),
      participants:   countMap[c.id] || 0,
      completions:    completionMap[c.id] || 0,
      completionRate: countMap[c.id]
        ? Math.round(((completionMap[c.id] || 0) / countMap[c.id]) * 100)
        : 0,
    }));

    const stats = {
      total:             enriched.length,
      active:            enriched.filter(c => c.status === 'active').length,
      completed:         enriched.filter(c => c.status === 'completed').length,
      totalParticipants: Object.values(countMap).reduce((a, v) => a + v, 0),
    };

    res.json({ challenges: enriched, stats });
  } catch (err) { next(err); }
});

// POST /api/admin/challenges — create challenge with tasks
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('status').optional().isIn(['draft', 'active', 'completed']),
    body('tasks').optional().isArray(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description, category, status = 'draft', start_date, end_date, reward_badge, points_reward = 100, tasks = [] } = req.body;

      const { data: challenge, error } = await supabaseAdmin
        .from('challenges')
        .insert({ title: title.trim(), description, category, status, start_date: start_date || null, end_date: end_date || null, reward_badge, points_reward, created_by: req.user.id })
        .select().single();

      if (error) throw error;

      // Insert tasks (supports both plain text and MCQ)
      if (tasks.length > 0) {
        const taskRows = tasks.map((t, i) => {
          if (typeof t === 'string') {
            return { challenge_id: challenge.id, title: t.trim(), order_index: i };
          }
          return {
            challenge_id:   challenge.id,
            title:          t.title?.trim() || `Question ${i + 1}`,
            order_index:    i,
            question:       t.question?.trim()     || null,
            option_a:       t.option_a?.trim()     || null,
            option_b:       t.option_b?.trim()     || null,
            option_c:       t.option_c?.trim()     || null,
            option_d:       t.option_d?.trim()     || null,
            correct_option: t.correct_option       || null,
            explanation:    t.explanation?.trim()  || null,
            points:         parseInt(t.points)     || 50,
          };
        });
        await supabaseAdmin.from('challenge_tasks').insert(taskRows);
      }

      res.status(201).json({ message: `Challenge "${title}" created`, challenge });
    } catch (err) { next(err); }
  }
);

// PATCH /api/admin/challenges/:id — update challenge
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'category', 'status', 'start_date', 'end_date', 'reward_badge', 'points_reward'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from('challenges').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;

    // If tasks array provided, replace all tasks (supports MCQ objects)
    if (Array.isArray(req.body.tasks)) {
      await supabaseAdmin.from('challenge_tasks').delete().eq('challenge_id', req.params.id);
      if (req.body.tasks.length > 0) {
        const taskRows = req.body.tasks.map((t, i) => {
          if (typeof t === 'string') {
            return { challenge_id: req.params.id, title: t.trim(), order_index: i };
          }
          return {
            challenge_id:   req.params.id,
            title:          t.title?.trim() || `Question ${i + 1}`,
            order_index:    i,
            question:       t.question?.trim()     || null,
            option_a:       t.option_a?.trim()     || null,
            option_b:       t.option_b?.trim()     || null,
            option_c:       t.option_c?.trim()     || null,
            option_d:       t.option_d?.trim()     || null,
            correct_option: t.correct_option       || null,
            explanation:    t.explanation?.trim()  || null,
            points:         parseInt(t.points)     || 50,
          };
        });
        await supabaseAdmin.from('challenge_tasks').insert(taskRows);
      }
    }

    res.json({ message: 'Challenge updated', challenge: data });
  } catch (err) { next(err); }
});

// DELETE /api/admin/challenges/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from('challenges').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Challenge deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/challenges/leaderboard
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('challenge_participants')
      .select('user_id, score, user:users!user_id ( username )');

    if (error) throw error;

    const userMap = new Map();
    (data || []).forEach(p => {
      const e = userMap.get(p.user_id) || { username: p.user?.username || 'Unknown', points: 0, badges: 0 };
      e.points += p.score || 0;
      if (p.score > 0) e.badges += 1;
      userMap.set(p.user_id, e);
    });

    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, i) => ({ rank: i + 1, ...u }));

    res.json({ leaderboard });
  } catch (err) { next(err); }
});

module.exports = router;
