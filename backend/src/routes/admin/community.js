/**
 * Admin Community Routes — /api/admin/community
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/community/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [groups, posts, events, members] = await Promise.all([
      supabaseAdmin.from('community_groups').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('community_posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('community_events').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('community_group_members').select('*', { count: 'exact', head: true }),
    ]);
    const { count: flagged } = await supabaseAdmin
      .from('community_posts').select('*', { count: 'exact', head: true }).eq('is_flagged', true);

    res.json({
      groups:  groups.count  || 0,
      posts:   posts.count   || 0,
      events:  events.count  || 0,
      members: members.count || 0,
      flagged: flagged        || 0,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/community/groups
router.get('/groups', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('community_groups')
      .select('id, name, description, category, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { data: members } = await supabaseAdmin.from('community_group_members').select('group_id');
    const { data: posts }   = await supabaseAdmin.from('community_posts').select('group_id');
    const mCount = {}, pCount = {};
    (members || []).forEach(m => { mCount[m.group_id] = (mCount[m.group_id] || 0) + 1; });
    (posts   || []).forEach(p => { if (p.group_id) pCount[p.group_id] = (pCount[p.group_id] || 0) + 1; });

    res.json({ groups: (data || []).map(g => ({ ...g, members: mCount[g.id] || 0, posts: pCount[g.id] || 0 })) });
  } catch (err) { next(err); }
});

// POST /api/admin/community/groups
router.post('/groups',
  [body('name').trim().notEmpty(), body('category').trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, description, category } = req.body;
      const { data, error } = await supabaseAdmin
        .from('community_groups')
        .insert({ name: name.trim(), description: description?.trim() || null, category, created_by: req.user.id })
        .select().single();
      if (error) throw error;
      res.status(201).json({ message: `Group "${name}" created`, group: data });
    } catch (err) { next(err); }
  }
);

// DELETE /api/admin/community/groups/:id
router.delete('/groups/:id', async (req, res, next) => {
  try {
    await supabaseAdmin.from('community_groups').delete().eq('id', req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/community/posts
router.get('/posts', async (req, res, next) => {
  try {
    const { flagged, type } = req.query;
    let q = supabaseAdmin
      .from('community_posts')
      .select('id, title, category, post_type, is_flagged, like_count, view_count, created_at, author:users!author_id ( username )')
      .order('created_at', { ascending: false });
    if (flagged === 'true') q = q.eq('is_flagged', true);
    if (type && type !== 'all') q = q.eq('post_type', type);
    const { data, error } = await q;
    if (error) throw error;

    const { data: comments } = await supabaseAdmin.from('community_comments').select('post_id');
    const cMap = {};
    (comments || []).forEach(c => { cMap[c.post_id] = (cMap[c.post_id] || 0) + 1; });

    res.json({ posts: (data || []).map(p => ({ ...p, comments: cMap[p.id] || 0, author: p.author?.username || 'Unknown' })) });
  } catch (err) { next(err); }
});

// PATCH /api/admin/community/posts/:id/flag
router.patch('/posts/:id/flag', async (req, res, next) => {
  try {
    const { flagged } = req.body;
    const { data, error } = await supabaseAdmin
      .from('community_posts').update({ is_flagged: flagged }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ message: flagged ? 'Post flagged' : 'Flag cleared', post: data });
  } catch (err) { next(err); }
});

// DELETE /api/admin/community/posts/:id
router.delete('/posts/:id', async (req, res, next) => {
  try {
    await supabaseAdmin.from('community_posts').delete().eq('id', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/community/events
router.get('/events', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('community_events')
      .select('id, title, description, event_date, event_time, location, event_type, meeting_link, status, created_at')
      .order('event_date', { ascending: true });
    if (error) throw error;

    const { data: rsvps } = await supabaseAdmin.from('community_event_rsvps').select('event_id');
    const rMap = {};
    (rsvps || []).forEach(r => { rMap[r.event_id] = (rMap[r.event_id] || 0) + 1; });

    res.json({ events: (data || []).map(e => ({ ...e, attendees: rMap[e.id] || 0 })) });
  } catch (err) { next(err); }
});

// POST /api/admin/community/events
router.post('/events',
  [
    body('title').trim().notEmpty(),
    body('event_date').isISO8601(),
    body('event_type').isIn(['virtual', 'in-person']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { title, description, event_date, event_time, location, event_type, meeting_link, status = 'upcoming' } = req.body;
      const { data, error } = await supabaseAdmin
        .from('community_events')
        .insert({ title: title.trim(), description: description?.trim() || null, event_date, event_time: event_time || null, location: location?.trim() || null, event_type, meeting_link: meeting_link || null, status, created_by: req.user.id })
        .select().single();
      if (error) throw error;
      res.status(201).json({ message: `Event "${title}" created`, event: data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/admin/community/events/:id
router.patch('/events/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'event_date', 'event_time', 'location', 'event_type', 'meeting_link', 'status'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const { data, error } = await supabaseAdmin.from('community_events').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ message: 'Event updated', event: data });
  } catch (err) { next(err); }
});

// DELETE /api/admin/community/events/:id
router.delete('/events/:id', async (req, res, next) => {
  try {
    await supabaseAdmin.from('community_events').delete().eq('id', req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
