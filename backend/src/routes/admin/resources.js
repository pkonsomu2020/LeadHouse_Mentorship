/**
 * Admin Resources Routes — /api/admin/resources
 * Full CRUD for the resource library + file upload.
 */
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// Multer — store uploads in memory, max 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4', 'video/quicktime', 'video/webm',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type "${file.mimetype}" is not allowed`));
  },
});

// POST /api/admin/resources/upload — upload a file to Supabase Storage
// Returns { url } — the public URL of the uploaded file
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext      = path.extname(req.file.originalname).toLowerCase();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `resources/${Date.now()}-${safeName}`;

    const { error } = await supabaseAdmin.storage
      .from('leadhouse-resources')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabaseAdmin.storage
      .from('leadhouse-resources')
      .getPublicUrl(filename);

    res.json({
      url:      urlData.publicUrl,
      filename: req.file.originalname,
      path:     filename,
      size:     req.file.size,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/resources — all resources (including drafts)
router.get('/', async (req, res, next) => {
  try {
    const { search, type, category, status } = req.query;

    let q = supabaseAdmin
      .from('resources')
      .select('id, title, type, category, description, url, duration, rating, view_count, author, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status   && status   !== 'all') q = q.eq('status', status);
    if (type     && type     !== 'all') q = q.ilike('type', `%${type}%`);
    if (category && category !== 'all') q = q.ilike('category', `%${category}%`);
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;

    const resources = data || [];
    const stats = {
      total:     resources.length,
      published: resources.filter(r => r.status === 'published').length,
      draft:     resources.filter(r => r.status === 'draft').length,
      totalViews: resources.reduce((a, r) => a + (r.view_count || 0), 0),
    };

    res.json({ resources, stats });
  } catch (err) { next(err); }
});

// POST /api/admin/resources — create resource
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(['article', 'video', 'pdf', 'guide']).withMessage('Invalid type'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('url').optional().isURL().withMessage('URL must be valid'),
    body('status').optional().isIn(['published', 'draft']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, type, category, description, url, status = 'draft' } = req.body;

      const { data, error } = await supabaseAdmin
        .from('resources')
        .insert({
          title:       title.trim(),
          type:        type.toLowerCase(),
          category:    category.trim(),
          description: description.trim(),
          url:         url || null,
          status,
          view_count:  0,
          rating:      0,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ message: `Resource "${title}" created`, resource: data });
    } catch (err) { next(err); }
  }
);

// PATCH /api/admin/resources/:id — update resource
router.patch('/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('type').optional().isIn(['article', 'video', 'pdf', 'guide']),
    body('status').optional().isIn(['published', 'draft']),
    body('url').optional().isURL(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const allowed = ['title', 'type', 'category', 'description', 'url', 'status'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const { data, error } = await supabaseAdmin
        .from('resources').update(updates).eq('id', req.params.id).select().single();

      if (error) throw error;
      res.json({ message: 'Resource updated', resource: data });
    } catch (err) { next(err); }
  }
);

// DELETE /api/admin/resources/:id
router.delete('/:id', async (req, res, next) => {
  try {
    // Fetch the resource first to get its URL (for storage cleanup)
    const { data: resource } = await supabaseAdmin
      .from('resources').select('id, url').eq('id', req.params.id).single();

    const { error } = await supabaseAdmin.from('resources').delete().eq('id', req.params.id);
    if (error) throw error;

    // If the URL points to our Supabase Storage, delete the file too
    if (resource?.url && resource.url.includes('leadhouse-resources')) {
      const storagePath = resource.url.split('/leadhouse-resources/')[1];
      if (storagePath) {
        await supabaseAdmin.storage
          .from('leadhouse-resources')
          .remove([storagePath])
          .catch(() => {}); // non-critical
      }
    }

    res.json({ message: 'Resource deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
