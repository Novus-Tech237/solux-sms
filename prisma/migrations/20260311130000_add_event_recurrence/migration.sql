-- CreateEnum
CREATE TYPE "EventRecurrence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "recurrence" "EventRecurrence" NOT NULL DEFAULT 'WEEKLY';
