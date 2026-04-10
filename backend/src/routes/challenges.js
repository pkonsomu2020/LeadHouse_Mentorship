/**
 * Challenges Routes — /api/challenges
 * Users browse, join, and complete challenge tasks.
 */
require('dotenv').config();
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/challenges — active + completed challenges
// Public read; joined/completion status requires auth
// ─────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all active/completed challenges with tasks
    const { data: challenges, error } = await supabaseAdmin
      .from('challenges')
      .select(`
        id, title, description, category, status,
        start_date, end_date, reward_badge, points_reward, created_at,
        tasks:challenge_tasks ( id, title, order_index, question, option_a, option_b, option_c, option_d, correct_option, explanation, points )
      `)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user's participations
    const { data: participations } = await supabaseAdmin
      .from('challenge_participants')
      .select('challenge_id, score, completed_at, joined_at')
      .eq('user_id', userId);

    // Fetch user's task completions (with chosen answers)
    const { data: taskCompletions } = await supabaseAdmin
      .from('challenge_task_completions')
      .select('task_id, chosen_option, is_correct, points_earned')
      .eq('user_id', userId);

    const completedTaskIds = new Set((taskCompletions || []).map(t => t.task_id));
    const completionMap    = new Map((taskCompletions || []).map(t => [t.task_id, t]));
    const participationMap = new Map((participations || []).map(p => [p.challenge_id, p]));

    // Fetch participant counts
    const { data: counts } = await supabaseAdmin
      .from('challenge_participants')
      .select('challenge_id');

    const countMap = {};
    (counts || []).forEach(c => { countMap[c.challenge_id] = (countMap[c.challenge_id] || 0) + 1; });

    const enriched = (challenges || []).map(c => {
      const participation = participationMap.get(c.id);
      const tasks = (c.tasks || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(t => ({
          ...t,
          completed:     completedTaskIds.has(t.id),
          chosenOption:  completionMap.get(t.id)?.chosen_option || null,
          isCorrect:     completionMap.get(t.id)?.is_correct    || false,
          pointsEarned:  completionMap.get(t.id)?.points_earned || 0,
        }));

      const completedCount = tasks.filter(t => t.completed).length;
      const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

      const now = new Date();
      const end = c.end_date ? new Date(c.end_date) : null;
      const daysLeft = end ? Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24))) : null;

      return {
        id:           c.id,
        title:        c.title,
        description:  c.description,
        category:     c.category,
        status:       c.status,
        startDate:    c.start_date,
        endDate:      c.end_date,
        daysLeft,
        rewardBadge:  c.reward_badge,
        pointsReward: c.points_reward,
        participants: countMap[c.id] || 0,
        tasks,
        isJoined:     !!participation,
        isCompleted:  !!participation?.completed_at,
        progress:     participation ? progress : 0,
        score:        participation?.score || 0,
        completedAt:  participation?.completed_at || null,
      };
    });

    // User stats
    const joined    = enriched.filter(c => c.isJoined);
    const completed = enriched.filter(c => c.isCompleted);
    const totalPoints = (participations || []).reduce((a, p) => a + (p.score || 0), 0);

    res.json({
      challenges: enriched,
      stats: {
        active:      joined.filter(c => !c.isCompleted).length,
        completed:   completed.length,
        totalPoints,
        badges:      completed.length,
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /api/challenges/:id/join
// User joins a challenge
// ─────────────────────────────────────────
router.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const { data: challenge } = await supabaseAdmin
      .from('challenges').select('id, title, status').eq('id', req.params.id).single();

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.status !== 'active') return res.status(400).json({ error: 'This challenge is not active' });

    const { error } = await supabaseAdmin
      .from('challenge_participants')
      .insert({ challenge_id: req.params.id, user_id: req.user.id });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Already joined this challenge' });
      throw error;
    }

    res.status(201).json({ message: `Joined "${challenge.title}"` });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /api/challenges/:id/tasks/:taskId/complete
// User answers a question (MCQ) or marks a task done
// Body: { chosenOption: 'a'|'b'|'c'|'d' }  (optional for non-MCQ)
// ─────────────────────────────────────────
router.post('/:id/tasks/:taskId/complete', authenticate, async (req, res, next) => {
  try {
    // Verify user is a participant
    const { data: participation } = await supabaseAdmin
      .from('challenge_participants')
      .select('id, score')
      .eq('challenge_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!participation) return res.status(403).json({ error: 'Join this challenge first' });

    // Get the task to check if it's MCQ
    const { data: task } = await supabaseAdmin
      .from('challenge_tasks')
      .select('id, correct_option, points, explanation')
      .eq('id', req.params.taskId)
      .single();

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { chosenOption } = req.body;
    const isMCQ      = !!task.correct_option;
    const isCorrect  = isMCQ ? chosenOption === task.correct_option : true;
    const taskPoints = task.points || 50;
    const pointsEarned = isCorrect ? taskPoints : 0;

    // Record the answer
    const { error: insertErr } = await supabaseAdmin
      .from('challenge_task_completions')
      .insert({
        task_id:        req.params.taskId,
        user_id:        req.user.id,
        chosen_option:  chosenOption || null,
        is_correct:     isCorrect,
        points_earned:  pointsEarned,
      });

    if (insertErr) {
      if (insertErr.code === '23505') return res.status(409).json({ error: 'Already answered this question' });
      throw insertErr;
    }

    // Recalculate total score from all task completions in this challenge
    const { data: allTasks } = await supabaseAdmin
      .from('challenge_tasks').select('id').eq('challenge_id', req.params.id);

    const { data: completedTasks } = await supabaseAdmin
      .from('challenge_task_completions')
      .select('task_id, points_earned')
      .eq('user_id', req.user.id)
      .in('task_id', (allTasks || []).map(t => t.id));

    const answeredIds  = new Set((completedTasks || []).map(t => t.task_id));
    const totalScore   = (completedTasks || []).reduce((sum, t) => sum + (t.points_earned || 0), 0);
    const progress     = allTasks?.length ? Math.round((answeredIds.size / allTasks.length) * 100) : 0;
    const isCompleted  = progress === 100;

    await supabaseAdmin
      .from('challenge_participants')
      .update({ score: totalScore, completed_at: isCompleted ? new Date().toISOString() : null })
      .eq('challenge_id', req.params.id)
      .eq('user_id', req.user.id);

    res.json({
      message:      isCorrect ? '✅ Correct!' : '❌ Wrong answer',
      isCorrect,
      correctOption: task.correct_option,
      explanation:   task.explanation || null,
      pointsEarned,
      totalScore,
      progress,
      isCompleted,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// GET /api/challenges/leaderboard
// Top users by total points across all challenges
// ─────────────────────────────────────────
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('challenge_participants')
      .select('user_id, score, user:users!user_id ( username )');

    if (error) throw error;

    const userMap = new Map();
    (data || []).forEach(p => {
      const uname = p.user?.username || 'Unknown';
      const existing = userMap.get(p.user_id) || { username: uname, points: 0, badges: 0 };
      existing.points += p.score || 0;
      if (p.score > 0) existing.badges += 1;
      userMap.set(p.user_id, existing);
    });

    const leaderboard = Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, i) => ({ rank: i + 1, ...u }));

    res.json({ leaderboard });
  } catch (err) { next(err); }
});

module.exports = router;
