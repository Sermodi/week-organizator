-- Add unique constraint required for upsert ON CONFLICT on priorities
ALTER TABLE priorities
  ADD CONSTRAINT priorities_week_item_unique UNIQUE (week_id, brain_dump_item_id);
