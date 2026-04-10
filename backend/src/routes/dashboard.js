/**
 * User Dashboard Route — /api/dashboard
 * Aggregates all user metrics in one call.
 */
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate }  = require('../middleware/auth');
const express = require('express');
const router  = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      { data: sessions },
      { data: goals },
      { data: journalEntries },
      { data: matchData },
      { data: challengeData },
    ] = await Promise.all([
      supabaseAdmin.from('sessions')
        .select('id, topic, scheduled_at, duration_min, status, mentor:mentors(display_name, avatar_initials, field)')
        .eq('mentee_id', uid).order('scheduled_at', { ascending: false }),
      supabaseAdmin.from('goals')
        .select('id, title, progress, is_complete').eq('user_id', uid),
      supabaseAdmin.from('journal_entries')
        .select('id, mood, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
      supabaseAdmin.from('match_requests')
        .select('status').eq('mentee_id', uid),
      supabaseAdmin.from('challenge_participants')
        .select('score, completed_at').eq('user_id', uid),
    ]);

    // ── Stats ──────────────────────────────────────────────────────
    const completedSessions = (sessions || []).filter(s => s.status === 'completed');
    const upcomingSessions  = (sessions || []).filter(s => s.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 3);

    const activeGoals    = (goals || []).filter(g => !g.is_complete);
    const completedGoals = (goals || []).filter(g => g.is_complete);
    const avgGoalProgress = activeGoals.length
      ? Math.round(activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length)
      : 0;

    // Streak: consecutive days with journal entries
    const journalDays = new Set((journalEntries || []).map(e => new Date(e.created_at).toDateString()));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      if (journalDays.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }

    // Mood this week (last 7 journal entries with mood)
    const moodEntries = (journalEntries || [])
      .filter(e => e.mood && new Date(e.created_at) >= weekAgo)
      .slice(0, 7)
      .reverse();

    const moodData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
      const entry = moodEntries[i];
      return { day, mood: entry ? (entry.mood * 2) : null }; // scale 1-5 → 2-10
    });

    // Weekly activity (sessions + goal updates per day this week)
    const weeklyActivity = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (now.getDay() - 1 - i + 7) % 7);
      const dateStr = d.toDateString();
      const daySessions = (sessions || []).filter(s => new Date(s.scheduled_at).toDateString() === dateStr).length;
      const dayGoals    = (goals    || []).filter(g => new Date(g.created_at || now).toDateString() === dateStr).length;
      return { day, sessions: daySessions, goals: dayGoals };
    });

    // Growth score = weighted average of: goal progress, sessions, challenges
    const totalPoints = (challengeData || []).reduce((a, c) => a + (c.score || 0), 0);
    const growthScore = Math.min(100, Math.round(
      (avgGoalProgress * 0.4) +
      (Math.min(completedSessions.length * 5, 40)) +
      (Math.min(totalPoints / 10, 20))
    ));

    // Matched mentor
    const acceptedMatch = (matchData || []).find(m => m.status === 'accepted');

    res.json({
      stats: {
        streak,
        completedGoals:    completedGoals.length,
        completedSessions: completedSessions.length,
        growthScore:       `${growthScore}%`,
        totalPoints,
        activeGoals:       activeGoals.length,
        avgGoalProgress,
        isMatched:         !!acceptedMatch,
      },
      upcomingSessions: upcomingSessions.map(s => ({
        id:     s.id,
        topic:  s.topic,
        time:   new Date(s.scheduled_at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        mentor: s.mentor?.display_name || 'Unknown',
        avatar: s.mentor?.avatar_initials || '??',
        field:  s.mentor?.field || '',
      })),
      activeGoals: activeGoals.slice(0, 4).map(g => ({
        id:       g.id,
        title:    g.title,
        progress: g.progress,
      })),
      weeklyActivity,
      moodData,
    });
  } catch (err) { next(err); }
});

module.exports = router;
