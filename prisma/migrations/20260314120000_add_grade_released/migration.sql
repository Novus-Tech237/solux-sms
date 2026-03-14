-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN "gradeReleased" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExamSubmission" ADD COLUMN "gradeReleased" BOOLEAN NOT NULL DEFAULT false;
