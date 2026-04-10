/**
 * Reports Routes — /api/reports
 * Users submit and track their own reports.
 */
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/reports — user's own submitted reports
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('id, target_type, target_label, reason, severity, status, created_at, updated_at')
      .eq('reporter_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ reports: data || [] });
  } catch (err) { next(err); }
});

// POST /api/reports — submit a new report
router.post('/',
  [
    body('targetType').isIn(['user', 'message', 'content', 'other']).withMessage('Invalid target type'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    body('severity').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { targetType, targetId, targetLabel, reason, details, severity = 'medium' } = req.body;

      const { data, error } = await supabaseAdmin
        .from('reports')
        .insert({
          reporter_id:  req.user.id,
          target_type:  targetType,
          target_id:    targetId  || null,
          target_label: targetLabel?.trim() || null,
          reason:       reason.trim(),
          details:      details?.trim() || null,
          severity,
          status:       'pending',
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ message: 'Report submitted. Our team will review it shortly.', report: data });
    } catch (err) { next(err); }
  }
);

module.exports = router;
