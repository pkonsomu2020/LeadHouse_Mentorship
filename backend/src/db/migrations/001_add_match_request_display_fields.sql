-- Migration: add display fields to match_requests for demo/admin use
-- Run in Supabase SQL Editor

ALTER TABLE match_requests
  ADD COLUMN IF NOT EXISTS mentee_username  TEXT,
  ADD COLUMN IF NOT EXISTS requested_field  TEXT,
  ADD COLUMN IF NOT EXISTS preferences      TEXT;

-- Allow NULL on mentor_id so admin can assign later
ALTER TABLE match_requests
  ALTER COLUMN mentor_id DROP NOT NULL;

-- Allow NULL on profile_id in mentors for demo/seeded mentors
ALTER TABLE mentors
  ALTER COLUMN profile_id DROP NOT NULL;
