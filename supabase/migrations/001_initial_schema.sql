-- ============================================================
-- WeekOrganizator — Initial Schema
-- ============================================================

-- ── users_profile ──────────────────────────────────────────
CREATE TABLE users_profile (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── areas ──────────────────────────────────────────────────
CREATE TABLE areas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1', -- hex color
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── weeks ──────────────────────────────────────────────────
CREATE TABLE weeks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,           -- Monday of that ISO week
  current_step    INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  completed_steps INTEGER[] DEFAULT '{}',  -- e.g. ARRAY[1,2,3]
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- ── brain_dump_items ───────────────────────────────────────
CREATE TABLE brain_dump_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id    UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  area_id    UUID REFERENCES areas(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── priorities ─────────────────────────────────────────────
CREATE TABLE priorities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id             UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brain_dump_item_id  UUID REFERENCES brain_dump_items(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  area_id             UUID REFERENCES areas(id) ON DELETE SET NULL,
  score               INTEGER CHECK (score BETWEEN 0 AND 100),
  classification      TEXT CHECK (classification IN ('top_priority', 'essential', 'not_essential')),
  is_number_one       BOOLEAN DEFAULT FALSE,
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── tasks ──────────────────────────────────────────────────
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id          UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_id      UUID REFERENCES priorities(id) ON DELETE SET NULL,
  action_verb      TEXT NOT NULL,
  concrete_object  TEXT NOT NULL,
  victory_condition TEXT NOT NULL,
  area_id          UUID REFERENCES areas(id) ON DELETE SET NULL,
  priority_level   TEXT CHECK (priority_level IN ('top', 'high', 'medium', 'low')),
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── time_blocks ────────────────────────────────────────────
CREATE TABLE time_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id      UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id      UUID REFERENCES tasks(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  block_type   TEXT DEFAULT 'task' CHECK (block_type IN ('task', 'fixed_commitment', 'deep_work', 'buffer')),
  label        TEXT,  -- for fixed_commitment blocks without a task
  color        TEXT,  -- override color
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── reflections ────────────────────────────────────────────
CREATE TABLE reflections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id         UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  what_worked     TEXT,
  what_didnt      TEXT,
  what_to_change  TEXT,
  overall_rating  INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_weeks_user_week       ON weeks(user_id, week_start);
CREATE INDEX idx_brain_dump_week       ON brain_dump_items(week_id);
CREATE INDEX idx_priorities_week       ON priorities(week_id);
CREATE INDEX idx_tasks_week            ON tasks(week_id);
CREATE INDEX idx_time_blocks_week      ON time_blocks(week_id);
CREATE INDEX idx_areas_user            ON areas(user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_profile_updated_at  BEFORE UPDATE ON users_profile   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_areas_updated_at          BEFORE UPDATE ON areas            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_weeks_updated_at          BEFORE UPDATE ON weeks            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_brain_dump_updated_at     BEFORE UPDATE ON brain_dump_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_priorities_updated_at     BEFORE UPDATE ON priorities       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at          BEFORE UPDATE ON tasks            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_time_blocks_updated_at    BEFORE UPDATE ON time_blocks      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reflections_updated_at    BEFORE UPDATE ON reflections      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Helper: get or create week for current user
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_week(p_user_id UUID, p_week_start DATE)
RETURNS UUID AS $$
DECLARE v_week_id UUID;
BEGIN
  SELECT id INTO v_week_id FROM weeks
  WHERE user_id = p_user_id AND week_start = p_week_start;
  IF v_week_id IS NULL THEN
    INSERT INTO weeks(user_id, week_start) VALUES(p_user_id, p_week_start)
    RETURNING id INTO v_week_id;
  END IF;
  RETURN v_week_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE users_profile   ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_dump_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections      ENABLE ROW LEVEL SECURITY;

-- users_profile
CREATE POLICY "up_select" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "up_insert" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "up_update" ON users_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "up_delete" ON users_profile FOR DELETE USING (auth.uid() = id);

-- areas
CREATE POLICY "areas_select" ON areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "areas_insert" ON areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "areas_update" ON areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "areas_delete" ON areas FOR DELETE USING (auth.uid() = user_id);

-- weeks
CREATE POLICY "weeks_select" ON weeks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weeks_insert" ON weeks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weeks_update" ON weeks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weeks_delete" ON weeks FOR DELETE USING (auth.uid() = user_id);

-- brain_dump_items
CREATE POLICY "bdi_select" ON brain_dump_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bdi_insert" ON brain_dump_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bdi_update" ON brain_dump_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bdi_delete" ON brain_dump_items FOR DELETE USING (auth.uid() = user_id);

-- priorities
CREATE POLICY "pri_select" ON priorities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pri_insert" ON priorities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pri_update" ON priorities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pri_delete" ON priorities FOR DELETE USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- time_blocks
CREATE POLICY "tb_select" ON time_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tb_insert" ON time_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tb_update" ON time_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tb_delete" ON time_blocks FOR DELETE USING (auth.uid() = user_id);

-- reflections
CREATE POLICY "ref_select" ON reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ref_insert" ON reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ref_update" ON reflections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ref_delete" ON reflections FOR DELETE USING (auth.uid() = user_id);
