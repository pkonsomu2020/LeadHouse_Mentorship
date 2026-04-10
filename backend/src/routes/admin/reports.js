/**
 * Admin Reports Routes — /api/admin/reports
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/reports — all reports with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, severity } = req.query;

    let q = supabaseAdmin
      .from('reports')
      .select(`
        id, target_type, target_label, reason, details,
        severity, status, created_at, updated_at,
        reporter:users!reporter_id ( username )
      `)
      .order('created_at', { ascending: false });

    if (status   && status   !== 'all') q = q.eq('status',   status);
    if (severity && severity !== 'all') q = q.eq('severity', severity);

    const { data, error } = await q;
    if (error) throw error;

    const reports = (data || []).map(r => ({
      id:          r.id,
      reporter:    r.reporter?.username || 'Anonymous',
      targetType:  r.target_type,
      targetLabel: r.target_label || r.target_type,
      reason:      r.reason,
      details:     r.details,
      severity:    r.severity,
      status:      r.status,
      createdAt:   r.created_at,
      updatedAt:   r.updated_at,
    }));

    const stats = {
      total:         reports.length,
      pending:       reports.filter(r => r.status === 'pending').length,
      investigating: reports.filter(r => r.status === 'investigating').length,
      resolved:      reports.filter(r => r.status === 'resolved').length,
      dismissed:     reports.filter(r => r.status === 'dismissed').length,
    };

    res.json({ reports, stats });
  } catch (err) { next(err); }
});

// PATCH /api/admin/reports/:id/status — update report status
router.patch('/:id/status',
  [body('status').isIn(['pending', 'investigating', 'resolved', 'dismissed'])],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { status, note } = req.body;
      const updates = {
        status,
        ...(status === 'resolved' || status === 'dismissed'
          ? { resolved_by: req.user.id, resolved_at: new Date().toISOString() }
          : {}),
      };

      const { data, error } = await supabaseAdmin
        .from('reports').update(updates).eq('id', req.params.id).select().single();

      if (error) throw error;

      // Auto-add to moderation log if resolved/dismissed
      if ((status === 'resolved' || status === 'dismissed') && data) {
        await supabaseAdmin.from('moderation_log').insert({
          report_id: req.params.id,
          admin_id:  req.user.id,
          action:    status === 'resolved' ? 'Report resolved' : 'Report dismissed',
          target:    data.target_label || data.target_type,
          reason:    note || data.reason,
        }).catch(() => {});
      }

      res.json({ message: `Report marked as ${status}`, report: data });
    } catch (err) { next(err); }
  }
);

// DELETE /api/admin/reports/:id — delete a report
router.delete('/:id', async (req, res, next) => {
  try {
    await supabaseAdmin.from('reports').delete().eq('id', req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/reports/modlog — moderation log
router.get('/modlog', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('moderation_log')
      .select(`
        id, action, target, reason, created_at,
        admin:profiles!admin_id ( username )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      log: (data || []).map(m => ({
        id:        m.id,
        action:    m.action,
        target:    m.target,
        reason:    m.reason,
        admin:     m.admin?.username || 'Admin',
        createdAt: m.created_at,
      })),
    });
  } catch (err) { next(err); }
});

// POST /api/admin/reports/modlog — add manual moderation log entry
router.post('/modlog',
  [
    body('action').trim().notEmpty(),
    body('target').trim().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { action, target, reason, reportId } = req.body;
      const { data, error } = await supabaseAdmin
        .from('moderation_log')
        .insert({
          admin_id:  req.user.id,
          report_id: reportId || null,
          action:    action.trim(),
          target:    target.trim(),
          reason:    reason?.trim() || null,
        })
        .select().single();

      if (error) throw error;
      res.status(201).json({ message: 'Log entry added', entry: data });
    } catch (err) { next(err); }
  }
);

module.exports = router;
