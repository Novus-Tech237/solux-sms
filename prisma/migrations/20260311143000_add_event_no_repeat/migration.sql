-- Add enum value for one-time events
ALTER TYPE "EventRecurrence" ADD VALUE IF NOT EXISTS 'NONE';

-- Make new events non-recurring by default
ALTER TABLE "Event"
ALTER COLUMN "recurrence" SET DEFAULT 'NONE';
