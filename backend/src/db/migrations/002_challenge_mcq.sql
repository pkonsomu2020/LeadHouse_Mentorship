-- ============================================================
-- Migration 002: Add MCQ (Multiple Choice) support to challenges
-- Run in Supabase SQL Editor
-- ============================================================

-- Add MCQ columns to challenge_tasks
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS question      TEXT;
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS option_a      TEXT;
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS option_b      TEXT;
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS option_c      TEXT;
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS option_d      TEXT;
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS correct_option TEXT CHECK (correct_option IN ('a','b','c','d'));
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS explanation   TEXT;  -- shown after answering
ALTER TABLE challenge_tasks ADD COLUMN IF NOT EXISTS points        INTEGER DEFAULT 50;

-- Add chosen_answer to task completions (so we know what the user picked)
ALTER TABLE challenge_task_completions ADD COLUMN IF NOT EXISTS chosen_option TEXT CHECK (chosen_option IN ('a','b','c','d'));
ALTER TABLE challenge_task_completions ADD COLUMN IF NOT EXISTS is_correct    BOOLEAN DEFAULT FALSE;
ALTER TABLE challenge_task_completions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
