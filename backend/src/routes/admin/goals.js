/**
 * Admin Goals Routes — /api/admin/goals
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/goals — all goals platform-wide with stats
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let q = supabaseAdmin
      .from('goals')
      .select(`
        id, title, description, progress, is_complete, due_date, created_at, user_id,
        user:users!user_id ( username )
      `)
      .order('created_at', { ascending: false });

    if (status === 'active')    q = q.eq('is_complete', false);
    if (status === 'completed') q = q.eq('is_complete', true);
    if (search) q = q.ilike('title', `%${search}%`);

    const { data, error } = await q;
    if (error) throw error;

    const goals = (data || []).map(g => ({
      id:          g.id,
      title:       g.title,
      description: g.description,
      progress:    g.progress,
      isComplete:  g.is_complete,
      dueDate:     g.due_date,
      userId:      g.user_id,
      username:    g.user?.username || `User-${g.user_id?.slice(0, 6)}`,
      createdAt:   g.created_at,
    }));

    // Category breakdown from title keywords
    const categoryMap = {};
    const keywords = {
      'career': 'Career', 'job': 'Career', 'coding': 'Career', 'course': 'Career',
      'fitness': 'Fitness', 'exercise': 'Fitness', 'gym': 'Fitness', 'run': 'Fitness',
      'save': 'Financial', 'money': 'Financial', 'fund': 'Financial', 'budget': 'Financial',
      'journal': 'Mental Health', 'mental': 'Mental Health', 'meditat': 'Mental Health',
      'mentor': 'Mentorship', 'session': 'Mentorship',
      'read': 'Personal Growth', 'book': 'Personal Growth', 'learn': 'Personal Growth',
    };
    goals.forEach(g => {
      const lower = g.title.toLowerCase();
      let matched = 'Other';
      for (const [kw, cat] of Object.entries(keywords)) {
        if (lower.includes(kw)) { matched = cat; break; }
      }
      categoryMap[matched] = (categoryMap[matched] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const stats = {
      total:       goals.length,
      active:      goals.filter(g => !g.isComplete).length,
      completed:   goals.filter(g => g.isComplete).length,
      avgProgress: goals.length
        ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
        : 0,
    };

    res.json({ goals, stats, categoryData });
  } catch (err) { next(err); }
});

module.exports = router;
