/**
 * Global Search Route — /api/search
 * Searches mentors, goals, resources, sessions, challenges, community posts.
 */
require('dotenv').config();
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });

    const query = q.trim();
    const uid   = req.user.id;

    const [
      { data: mentors },
      { data: goals },
      { data: resources },
      { data: sessions },
      { data: challenges },
      { data: posts },
    ] = await Promise.all([
      // Mentors
      supabaseAdmin.from('mentors')
        .select('id, display_name, field, county, avatar_initials')
        .or(`display_name.ilike.%${query}%,field.ilike.%${query}%`)
        .eq('is_verified', true).limit(4),

      // User's goals
      supabaseAdmin.from('goals')
        .select('id, title, progress, is_complete')
        .eq('user_id', uid)
        .ilike('title', `%${query}%`).limit(3),

      // Resources
      supabaseAdmin.from('resources')
        .select('id, title, type, category')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%`).limit(3),

      // User's sessions
      supabaseAdmin.from('sessions')
        .select('id, topic, status, scheduled_at, mentor:mentors(display_name)')
        .eq('mentee_id', uid)
        .ilike('topic', `%${query}%`).limit(3),

      // Active challenges
      supabaseAdmin.from('challenges')
        .select('id, title, category')
        .eq('status', 'active')
        .ilike('title', `%${query}%`).limit(3),

      // Community posts
      supabaseAdmin.from('community_posts')
        .select('id, title, post_type, category')
        .eq('is_flagged', false)
        .ilike('title', `%${query}%`).limit(3),
    ]);

    const results = [
      ...(mentors   || []).map(m => ({ type: 'mentor',    id: m.id,    label: m.display_name, sub: `${m.field} · ${m.county}`,                    url: '/dashboard/mentors',    avatar: m.avatar_initials })),
      ...(goals     || []).map(g => ({ type: 'goal',      id: g.id,    label: g.title,         sub: `${g.progress}% complete`,                      url: '/dashboard/goals' })),
      ...(resources || []).map(r => ({ type: 'resource',  id: r.id,    label: r.title,         sub: `${r.type} · ${r.category}`,                    url: '/dashboard/resources' })),
      ...(sessions  || []).map(s => ({ type: 'session',   id: s.id,    label: s.topic,         sub: `${s.mentor?.display_name} · ${s.status}`,      url: '/dashboard/sessions' })),
      ...(challenges|| []).map(c => ({ type: 'challenge', id: c.id,    label: c.title,         sub: c.category,                                     url: '/dashboard/challenges' })),
      ...(posts     || []).map(p => ({ type: 'post',      id: p.id,    label: p.title,         sub: `${p.post_type} · ${p.category || 'Community'}`,url: '/dashboard/community' })),
    ];

    res.json({ results, query });
  } catch (err) { next(err); }
});

module.exports = router;
