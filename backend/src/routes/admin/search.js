/**
 * Admin Global Search — GET /api/admin/search?q=...
 * Searches users, mentors, sessions, challenges, reports, community posts
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });
    const query = q.trim();

    const [
      { data: users },
      { data: mentors },
      { data: challenges },
      { data: sessions },
      { data: reports },
      { data: posts },
      { data: resources },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('id, username, email, role, is_active')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`).limit(5),

      supabaseAdmin.from('mentors').select('id, profile_id, display_name, field, county, is_verified')
        .or(`display_name.ilike.%${query}%,field.ilike.%${query}%,county.ilike.%${query}%`).limit(5),

      supabaseAdmin.from('challenges').select('id, title, category, status')
        .ilike('title', `%${query}%`).limit(4),

      supabaseAdmin.from('sessions').select('id, topic, status, scheduled_at')
        .ilike('topic', `%${query}%`).limit(4),

      supabaseAdmin.from('reports').select('id, reason, target_type, status, created_at')
        .or(`reason.ilike.%${query}%,target_label.ilike.%${query}%`).limit(4),

      supabaseAdmin.from('community_posts').select('id, title, post_type, category')
        .ilike('title', `%${query}%`).limit(4),

      supabaseAdmin.from('resources').select('id, title, type, category')
        .ilike('title', `%${query}%`).limit(4),
    ]);

    const results = [
      ...(users      || []).map(u => ({ type: 'user',      id: u.id,         label: u.username,      sub: u.email,                              url: '/users',      badge: u.role,       active: u.is_active })),
      ...(mentors    || []).map(m => ({ type: 'mentor',    id: m.id,         label: m.display_name,  sub: `${m.field} · ${m.county}`,           url: '/matching',   badge: m.is_verified ? 'verified' : 'unverified' })),
      ...(challenges || []).map(c => ({ type: 'challenge', id: c.id,         label: c.title,         sub: c.category,                           url: '/challenges', badge: c.status })),
      ...(sessions   || []).map(s => ({ type: 'session',   id: s.id,         label: s.topic,         sub: s.status,                             url: '/sessions',   badge: s.status })),
      ...(reports    || []).map(r => ({ type: 'report',    id: r.id,         label: r.reason,        sub: `${r.target_type} · ${r.status}`,     url: '/reports',    badge: r.status })),
      ...(posts      || []).map(p => ({ type: 'post',      id: p.id,         label: p.title,         sub: `${p.post_type} · ${p.category || ''}`,url: '/community', badge: p.post_type })),
      ...(resources  || []).map(r => ({ type: 'resource',  id: r.id,         label: r.title,         sub: `${r.type} · ${r.category}`,          url: '/content',    badge: r.type })),
    ];

    res.json({ results, query });
  } catch (err) { next(err); }
});

module.exports = router;
