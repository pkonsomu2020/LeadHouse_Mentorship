/**
 * Resources Routes — /api/resources
 * Public read, authenticated view tracking.
 */
require('dotenv').config();
const express = require('express');
const { query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/resources — list published resources with filters
router.get('/',
  [
    query('search').optional().isString().trim(),
    query('type').optional().isString().trim(),
    query('category').optional().isString().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { search, type, category } = req.query;

      let q = supabaseAdmin
        .from('resources')
        .select('id, title, type, category, description, url, duration, rating, view_count, author, created_at')
        .eq('status', 'published')
        .order('view_count', { ascending: false });

      if (type     && type     !== 'all') q = q.ilike('type',     `%${type}%`);
      if (category && category !== 'all') q = q.ilike('category', `%${category}%`);
      if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await q;
      if (error) throw error;

      res.json({ resources: data || [] });
    } catch (err) { next(err); }
  }
);

// POST /api/resources/:id/view — increment view count (authenticated)
router.post('/:id/view', authenticate, async (req, res, next) => {
  try {
    await supabaseAdmin.rpc('increment_resource_views', { resource_id: req.params.id })
      .catch(() => {
        // Fallback if RPC not available
        supabaseAdmin.from('resources')
          .select('view_count').eq('id', req.params.id).single()
          .then(({ data }) => {
            if (data) supabaseAdmin.from('resources')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('id', req.params.id);
          });
      });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
