ALTER TABLE "Program"
ADD COLUMN "semester" TEXT;

UPDATE "Program"
SET "semester" = 'Legacy Migration'
WHERE "semester" IS NULL;

ALTER TABLE "Program"
ALTER COLUMN "semester" SET NOT NULL;

ALTER TABLE "Program"
DROP CONSTRAINT IF EXISTS "Program_name_key";

ALTER TABLE "Program"
ADD CONSTRAINT "Program_name_semester_key" UNIQUE ("name", "semester");
