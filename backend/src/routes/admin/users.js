/**
 * Admin Users Route — /api/admin/users
 * Fetches from users (mentees) + mentors tables separately.
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/users — all mentees + mentors
router.get('/', async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    // Fetch mentees from users table
    let menteeQ = supabaseAdmin
      .from('users')
      .select('id, username, email, county, is_active, created_at')
      .order('created_at', { ascending: false });

    if (search) menteeQ = menteeQ.ilike('username', `%${search}%`);
    if (status === 'active')   menteeQ = menteeQ.eq('is_active', true);
    if (status === 'inactive') menteeQ = menteeQ.eq('is_active', false);

    // Fetch mentors from mentors table (include all, even those without auth account)
    let mentorQ = supabaseAdmin
      .from('mentors')
      .select('id, profile_id, display_name, email, county, is_active, is_verified, total_sessions, created_at')
      .order('created_at', { ascending: false });

    if (search) mentorQ = mentorQ.ilike('display_name', `%${search}%`);
    if (status === 'active')   mentorQ = mentorQ.eq('is_active', true);
    if (status === 'inactive') mentorQ = mentorQ.eq('is_active', false);

    const [{ data: mentees, error: e1 }, { data: mentors, error: e2 }] = await Promise.all([
      role === 'mentor' ? { data: [], error: null } : menteeQ,
      role === 'mentee' ? { data: [], error: null } : mentorQ,
    ]);

    if (e1) throw e1;
    if (e2) throw e2;

    // Get session counts per mentee
    const { data: sessionCounts } = await supabaseAdmin
      .from('sessions').select('mentee_id').eq('status', 'completed');
    const sessionMap = {};
    (sessionCounts || []).forEach(s => { sessionMap[s.mentee_id] = (sessionMap[s.mentee_id] || 0) + 1; });

    const allUsers = [
      ...(mentees || []).map(u => ({
        id:       u.id,
        username: u.username,
        email:    u.email,
        role:     'Mentee',
        status:   u.is_active ? 'active' : 'inactive',
        county:   u.county || '—',
        sessions: sessionMap[u.id] || 0,
        joined:   new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      })),
      ...(mentors || []).map(m => ({
        id:         m.profile_id || m.id,  // use profile_id if exists, else mentors.id
        username:   m.display_name,
        email:      m.email || '—',
        role:       'Mentor',
        status:     m.is_active ? (m.is_verified ? 'active' : 'pending') : 'inactive',
        county:     m.county || '—',
        sessions:   m.total_sessions || 0,
        joined:     new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        isVerified: m.is_verified,
        mentorId:   m.id,                  // always the mentors table UUID
      })),
    ];

    const stats = {
      total:     allUsers.length,
      active:    allUsers.filter(u => u.status === 'active').length,
      pending:   allUsers.filter(u => u.status === 'pending').length,
      inactive:  allUsers.filter(u => u.status === 'inactive').length,
    };

    res.json({ users: allUsers, stats });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/status — suspend/activate
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { is_active, role, mentorId } = req.body;

    if (role === 'mentor') {
      // Use mentors.id (not profile_id) for mentors without auth accounts
      const col = mentorId ? 'id' : 'profile_id';
      const val = mentorId || req.params.id;
      const { error } = await supabaseAdmin.from('mentors').update({ is_active }).eq(col, val);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('users').update({ is_active }).eq('id', req.params.id);
      if (error) throw error;
    }

    res.json({ message: `User ${is_active ? 'activated' : 'suspended'}` });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/verify — verify a mentor
router.patch('/:id/verify', async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    // Use mentors.id if provided, otherwise try profile_id
    const col = mentorId ? 'id' : 'profile_id';
    const val = mentorId || req.params.id;

    const { error } = await supabaseAdmin
      .from('mentors').update({ is_verified: true, is_available: true, is_active: true })
      .eq(col, val);

    if (error) throw error;
    res.json({ message: 'Mentor verified and activated' });
  } catch (err) { next(err); }
});

module.exports = router;
