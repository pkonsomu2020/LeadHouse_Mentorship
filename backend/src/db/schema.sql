-- ============================================================
-- LeadHouse Mentorship Platform — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,          -- anonymous username e.g. "ShadowEagle"
  role          TEXT NOT NULL DEFAULT 'mentee' CHECK (role IN ('mentee','mentor','admin')),
  full_name     TEXT,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  county        TEXT,
  age_group     TEXT,
  interests     TEXT[],
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MENTORS (extra info for mentor profiles)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  field           TEXT NOT NULL,
  county          TEXT NOT NULL,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  bio             TEXT,
  tags            TEXT[],
  avatar_initials TEXT,
  rating          NUMERIC(3,1) DEFAULT 0,
  total_sessions  INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MATCH REQUESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id   UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentee_id, mentor_id)
);

-- ─────────────────────────────────────────
-- SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentee_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id    UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  topic        TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60,
  status       TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_complete BOOLEAN DEFAULT FALSE,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- JOURNAL ENTRIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL,
  mood       INTEGER CHECK (mood BETWEEN 1 AND 10),
  tags       TEXT[],
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MENTOR REVIEWS / RATINGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id  UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mentors_updated_at     BEFORE UPDATE ON mentors     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at    BEFORE UPDATE ON sessions    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_goals_updated_at       BEFORE UPDATE ON goals       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_match_requests_updated BEFORE UPDATE ON match_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_journal_updated_at     BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- AUTO-UPDATE mentor rating from reviews
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentors
  SET rating = (
    SELECT ROUND(AVG(rating)::NUMERIC, 1)
    FROM mentor_reviews
    WHERE mentor_id = NEW.mentor_id
  )
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_mentor_rating
AFTER INSERT OR UPDATE ON mentor_reviews
FOR EACH ROW EXECUTE FUNCTION refresh_mentor_rating();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, only update their own
CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Mentors: anyone can read verified mentors
CREATE POLICY "mentors_read_all"    ON mentors FOR SELECT USING (true);
CREATE POLICY "mentors_update_own"  ON mentors FOR UPDATE USING (auth.uid() = profile_id);

-- Match requests: mentee sees their own, mentor sees requests for them
CREATE POLICY "match_requests_mentee" ON match_requests FOR ALL USING (auth.uid() = mentee_id);
CREATE POLICY "match_requests_mentor" ON match_requests FOR SELECT USING (
  auth.uid() = (SELECT profile_id FROM mentors WHERE id = mentor_id)
);

-- Sessions: participants only
CREATE POLICY "sessions_participants" ON sessions FOR ALL USING (
  auth.uid() = mentee_id OR
  auth.uid() = (SELECT profile_id FROM mentors WHERE id = mentor_id)
);

-- Goals: owner only
CREATE POLICY "goals_owner" ON goals FOR ALL USING (auth.uid() = user_id);

-- Messages: sender or receiver
CREATE POLICY "messages_participants" ON messages FOR ALL USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Journal: owner only
CREATE POLICY "journal_owner" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Reviews: anyone can read, only mentee can write their own
CREATE POLICY "reviews_read_all"   ON mentor_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_write_own"  ON mentor_reviews FOR INSERT WITH CHECK (auth.uid() = mentee_id);
