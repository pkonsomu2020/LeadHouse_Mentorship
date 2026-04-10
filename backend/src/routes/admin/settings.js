/**
 * Admin Settings Routes — /api/admin/settings
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/settings
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value');

    if (error) throw error;

    // Convert array to object
    const settings = {};
    (data || []).forEach(row => { settings[row.key] = row.value; });

    res.json({ settings });
  } catch (err) { next(err); }
});

// PATCH /api/admin/settings — update one or more settings
router.patch('/', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object required' });
    }

    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert(upserts, { onConflict: 'key' });

    if (error) throw error;
    res.json({ message: 'Settings saved' });
  } catch (err) { next(err); }
});

module.exports = router;
