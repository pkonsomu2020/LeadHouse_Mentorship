/**
 * Community Routes — /api/community
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GROUPS ────────────────────────────────────────────────────────

// GET /api/community/groups
router.get('/groups', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: groups, error } = await supabaseAdmin
      .from('community_groups')
      .select('id, name, description, category, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Member counts
    const { data: members } = await supabaseAdmin
      .from('community_group_members').select('group_id');
    const countMap = {};
    (members || []).forEach(m => { countMap[m.group_id] = (countMap[m.group_id] || 0) + 1; });

    // User's memberships
    const { data: myMemberships } = await supabaseAdmin
      .from('community_group_members').select('group_id').eq('user_id', userId);
    const myGroupIds = new Set((myMemberships || []).map(m => m.group_id));

    const enriched = (groups || []).map(g => ({
      ...g, members: countMap[g.id] || 0, isJoined: myGroupIds.has(g.id),
    }));

    res.json({ groups: enriched });
  } catch (err) { next(err); }
});

// POST /api/community/groups/:id/join
router.post('/groups/:id/join', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('community_group_members')
      .insert({ group_id: req.params.id, user_id: req.user.id });
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Already a member' });
      throw error;
    }
    res.status(201).json({ message: 'Joined group' });
  } catch (err) { next(err); }
});

// POST /api/community/groups/:id/leave
router.post('/groups/:id/leave', async (req, res, next) => {
  try {
    await supabaseAdmin.from('community_group_members')
      .delete().eq('group_id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Left group' });
  } catch (err) { next(err); }
});

// ── POSTS (discussions + stories) ────────────────────────────────

// GET /api/community/posts?type=discussion|story
router.get('/posts', async (req, res, next) => {
  try {
    const { type, category } = req.query;
    const userId = req.user.id;

    let q = supabaseAdmin
      .from('community_posts')
      .select(`
        id, title, content, category, post_type, is_flagged,
        like_count, view_count, created_at,
        author:users!author_id ( id, username )
      `)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false });

    if (type     && type     !== 'all') q = q.eq('post_type', type);
    if (category && category !== 'all') q = q.ilike('category', `%${category}%`);

    const { data, error } = await q;
    if (error) throw error;

    // User's likes
    const { data: myLikes } = await supabaseAdmin
      .from('community_post_likes').select('post_id').eq('user_id', userId);
    const likedIds = new Set((myLikes || []).map(l => l.post_id));

    // Comment counts
    const { data: comments } = await supabaseAdmin
      .from('community_comments').select('post_id');
    const commentMap = {};
    (comments || []).forEach(c => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });

    const posts = (data || []).map(p => ({
      id:         p.id,
      title:      p.title,
      content:    p.content,
      category:   p.category,
      postType:   p.post_type,
      likes:      p.like_count,
      comments:   commentMap[p.id] || 0,
      views:      p.view_count,
      isLiked:    likedIds.has(p.id),
      createdAt:  p.created_at,
      author:     p.author?.username || 'Anonymous',
      authorId:   p.author?.id,
    }));

    res.json({ posts });
  } catch (err) { next(err); }
});

// POST /api/community/posts — create post
router.post('/posts',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('postType').isIn(['discussion', 'story']).withMessage('Invalid post type'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, content, category, postType, groupId } = req.body;
      const { data, error } = await supabaseAdmin
        .from('community_posts')
        .insert({
          author_id: req.user.id,
          title:     title.trim(),
          content:   content.trim(),
          category:  category || null,
          post_type: postType,
          group_id:  groupId || null,
        })
        .select().single();

      if (error) throw error;
      res.status(201).json({ message: 'Post created', post: data });
    } catch (err) { next(err); }
  }
);

// POST /api/community/posts/:id/like — toggle like
router.post('/posts/:id/like', async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('community_post_likes').select('id')
      .eq('post_id', req.params.id).eq('user_id', req.user.id).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('community_post_likes').delete().eq('id', existing.id);
      await supabaseAdmin.from('community_posts')
        .update({ like_count: supabaseAdmin.rpc('decrement', { x: 1 }) })
        .eq('id', req.params.id).catch(() => {});
      // Fallback decrement
      const { data: post } = await supabaseAdmin.from('community_posts').select('like_count').eq('id', req.params.id).single();
      if (post) await supabaseAdmin.from('community_posts').update({ like_count: Math.max(0, (post.like_count || 1) - 1) }).eq('id', req.params.id);
      return res.json({ liked: false });
    }

    await supabaseAdmin.from('community_post_likes').insert({ post_id: req.params.id, user_id: req.user.id });
    const { data: post } = await supabaseAdmin.from('community_posts').select('like_count').eq('id', req.params.id).single();
    if (post) await supabaseAdmin.from('community_posts').update({ like_count: (post.like_count || 0) + 1 }).eq('id', req.params.id);
    res.json({ liked: true });
  } catch (err) { next(err); }
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('community_comments')
      .select('id, content, created_at, author:users!author_id ( username )')
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ comments: (data || []).map(c => ({ ...c, author: c.author?.username || 'Anonymous' })) });
  } catch (err) { next(err); }
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments',
  [body('content').trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { data, error } = await supabaseAdmin
        .from('community_comments')
        .insert({ post_id: req.params.id, author_id: req.user.id, content: req.body.content.trim() })
        .select().single();
      if (error) throw error;
      res.status(201).json({ message: 'Comment added', comment: data });
    } catch (err) { next(err); }
  }
);

// ── EVENTS ────────────────────────────────────────────────────────

// GET /api/community/events
router.get('/events', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: events, error } = await supabaseAdmin
      .from('community_events')
      .select('id, title, description, event_date, event_time, location, event_type, meeting_link, status, created_at')
      .order('event_date', { ascending: true });

    if (error) throw error;

    const { data: rsvps } = await supabaseAdmin.from('community_event_rsvps').select('event_id');
    const countMap = {};
    (rsvps || []).forEach(r => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1; });

    const { data: myRsvps } = await supabaseAdmin
      .from('community_event_rsvps').select('event_id').eq('user_id', userId);
    const myEventIds = new Set((myRsvps || []).map(r => r.event_id));

    const enriched = (events || []).map(e => ({
      ...e, attendees: countMap[e.id] || 0, isRegistered: myEventIds.has(e.id),
    }));

    res.json({ events: enriched });
  } catch (err) { next(err); }
});

// POST /api/community/events/:id/rsvp — toggle RSVP
router.post('/events/:id/rsvp', async (req, res, next) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('community_event_rsvps').select('id')
      .eq('event_id', req.params.id).eq('user_id', req.user.id).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('community_event_rsvps').delete().eq('id', existing.id);
      return res.json({ registered: false, message: 'RSVP cancelled' });
    }

    await supabaseAdmin.from('community_event_rsvps')
      .insert({ event_id: req.params.id, user_id: req.user.id });
    res.status(201).json({ registered: true, message: 'Registered for event' });
  } catch (err) { next(err); }
});

module.exports = router;
