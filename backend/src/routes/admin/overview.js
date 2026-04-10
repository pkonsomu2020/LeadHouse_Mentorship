/**
 * Admin Overview Route — /api/admin/overview
 * Aggregates all platform metrics in one call.
 */
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel fetch of all platform data
    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: activeMatches },
      { count: sessionsThisWeek },
      { count: pendingReports },
      { count: totalGoals },
      { count: totalChallengeParticipants },
      { data: recentProfiles },
      { data: recentMatches },
      { data: recentReports },
      { data: sessionsByWeek },
      { data: profilesByMonth },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('mentors').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('match_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('goals').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('challenge_participants').select('*', { count: 'exact', head: true }),
      // Recent activity: last 6 new profiles
      supabaseAdmin.from('users').select('id, username, role, created_at')
        .order('created_at', { ascending: false }).limit(3),
      // Recent matches
      supabaseAdmin.from('match_requests')
        .select('id, status, updated_at, mentee_username, mentor:mentors(display_name)')
        .order('updated_at', { ascending: false }).limit(3),
      // Recent reports
      supabaseAdmin.from('reports')
        .select('id, reason, severity, status, created_at').order('created_at', { ascending: false }).limit(3),
      // Sessions per week (last 4 weeks)
      supabaseAdmin.from('sessions').select('scheduled_at, status'),
      // User registrations per month (last 6 months)
      supabaseAdmin.from('users').select('created_at'),
    ]);

    // ── Weekly engagement chart ────────────────────────────────────
    const weeklyEngagement = [1, 2, 3, 4].map(weeksAgo => {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - weeksAgo * 7);
      const wEnd   = new Date(now); wEnd.setDate(wEnd.getDate() - (weeksAgo - 1) * 7);
      const wSessions = (sessionsByWeek || []).filter(s => {
        const d = new Date(s.scheduled_at);
        return d >= wStart && d < wEnd;
      }).length;
      return { week: `W${5 - weeksAgo}`, sessions: wSessions };
    }).reverse();

    // ── User growth chart (last 6 months) ─────────────────────────
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const userGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const count = (profilesByMonth || []).filter(p => {
        const pd = new Date(p.created_at);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      }).length;
      return { month: months[d.getMonth()], users: count };
    });
    // Make it cumulative
    let cumulative = Math.max(0, (totalUsers || 0) - userGrowth.reduce((a, m) => a + m.users, 0));
    const userGrowthCumulative = userGrowth.map(m => {
      cumulative += m.users;
      return { month: m.month, users: cumulative };
    });

    // ── Recent activity feed ───────────────────────────────────────
    const recentActivity = [
      ...(recentProfiles || []).map(p => ({
        action: `New ${p.role} registered`,
        user:   p.username || 'Unknown',
        time:   timeAgo(p.created_at),
        type:   'register',
      })),
      ...(recentMatches || []).map(m => ({
        action: m.status === 'accepted' ? 'Match created' : 'Match request',
        user:   `${m.mentee_username || 'User'} ↔ ${m.mentor?.display_name || 'Mentor'}`,
        time:   timeAgo(m.updated_at),
        type:   'match',
      })),
      ...(recentReports || []).map(r => ({
        action: 'Report submitted',
        user:   r.reason,
        time:   timeAgo(r.created_at),
        type:   'flag',
      })),
    ].sort((a, b) => 0).slice(0, 8);

    res.json({
      stats: {
        totalUsers:               totalUsers               || 0,
        totalMentors:             totalMentors             || 0,
        activeMatches:            activeMatches            || 0,
        sessionsThisWeek:         sessionsThisWeek         || 0,
        pendingReports:           pendingReports           || 0,
        totalGoals:               totalGoals               || 0,
        totalChallengeParticipants: totalChallengeParticipants || 0,
      },
      weeklyEngagement,
      userGrowth: userGrowthCumulative,
      recentActivity,
    });
  } catch (err) { next(err); }
});

function timeAgo(iso) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

module.exports = router;
