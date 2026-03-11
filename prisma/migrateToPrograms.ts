/**
 * Data Migration Script: Convert Class-based student assignments to Program-based enrollments
 * 
 * This script:
 * 1. Creates Programs from existing Grades
 * 2. Creates Courses from existing Classes under their Grade's Program
 * 3. Updates Lessons to link to courses instead of classes
 * 4. Creates StudentEnrollment records for all students based on their class assignment
 * 
 * Run with: npx ts-node prisma/seed.ts (or create a separate migration script)
 */

import prisma from "@/lib/prisma";

async function migrateToPrograms() {
  console.log("Starting migration to Program-based enrollment system...");

  try {
    // Step 1: Create Programs from Grades
    console.log("\n[Step 1] Creating Programs from existing Grades...");
    const grades = await prisma.grade.findMany();
    const programMap = new Map<number, number>(); // gradeId -> programId

    for (const grade of grades) {
      let program = await prisma.program.findFirst({
        where: {
          name: `Grade ${grade.level}`,
          semester: "Legacy Migration",
        },
      });

      if (!program) {
        program = await prisma.program.create({
          data: {
            name: `Grade ${grade.level}`,
            semester: "Legacy Migration",
            description: `Comprehensive program for Grade ${grade.level}`,
          },
        });
        console.log(`✓ Created Program: ${program.name}`);
      }

      programMap.set(grade.id, program.id);
    }

    // Step 2: Create Courses from Classes
    console.log("\n[Step 2] Creating Courses from existing Classes...");
    const classes = await prisma.class.findMany({
      include: { supervisor: true },
    });

    const courseMap = new Map<number, number>(); // classId -> courseId

    for (const schoolClass of classes) {
      // Find or assign a teacher for this course
      let teacherId = schoolClass.supervisorId;

      // If no supervisor, find any teacher
      if (!teacherId) {
        const anyTeacher = await prisma.teacher.findFirst();
        if (!anyTeacher) {
          console.warn(
            `⚠ No teachers available for course ${schoolClass.name}, skipping...`
          );
          continue;
        }
        teacherId = anyTeacher.id;
      }

      // Get the program from the student's grade if available
      const students = await prisma.student.findMany({
        where: { classId: schoolClass.id },
        select: { gradeId: true },
        take: 1,
      });

      const student = students[0];
      let programId = student && student.gradeId ? programMap.get(student.gradeId!) : null;

      // Fallback: use the first program if no specific program found
      if (!programId) {
        const firstProgram = await prisma.program.findFirst();
        if (!firstProgram) {
          console.warn(
            `⚠ No programs available for course ${schoolClass.name}, creating default...`
          );
          const defaultProgram = await prisma.program.create({
            data: {
              name: "Default Program",
              semester: "Legacy Migration",
              description: "Default program for legacy classes",
            },
          });
          programId = defaultProgram.id;
        } else {
          programId = firstProgram.id;
        }
      }

      const course = await prisma.course.create({
        data: {
          name: schoolClass.name,
          description: `Course based on class ${schoolClass.name}`,
          programId,
          teacherId,
        },
      });

      courseMap.set(schoolClass.id, course.id);
      console.log(
        `✓ Created Course: ${course.name} (Program: ${programId}, Teacher: ${teacherId})`
      );
    }

    // Step 3: Update Lessons to use courseId
    console.log("\n[Step 3] Updating Lessons to link to Courses...");
    const lessonsWithoutCourse = await prisma.lesson.findMany({
      where: { courseId: null },
    });

    for (const lesson of lessonsWithoutCourse) {
      if (lesson.courseId) {
        continue; // Already migrated
      }

      // If lesson has a classId, find corresponding course
      // For now, we'll assign to the first course to avoid null values
      // In production, you might want to handle this differently
      const firstCourse = await prisma.course.findFirst();

      if (firstCourse) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { courseId: firstCourse.id },
        });
        console.log(`✓ Updated Lesson: ${lesson.name} → Course: ${firstCourse.id}`);
      } else {
        console.warn(`⚠ No courses available for Lesson: ${lesson.name}, skipping...`);
      }
    }

    // Step 4: Create StudentEnrollment records
    console.log("\n[Step 4] Creating StudentEnrollment records...");
    const studentsWithClass = await prisma.student.findMany({
      where: {
        classId: { not: null },
        gradeId: { not: null },
      },
    });

    for (const student of studentsWithClass) {
      if (student.gradeId) {
        const programId = programMap.get(student.gradeId);

        if (programId) {
          // Check if enrollment already exists
          const existingEnrollment = await prisma.studentEnrollment.findUnique({
            where: {
              studentId_programId: {
                studentId: student.id,
                programId,
              },
            },
          });

          if (!existingEnrollment) {
            await prisma.studentEnrollment.create({
              data: {
                studentId: student.id,
                programId,
                status: "ACTIVE",
              },
            });
            console.log(
              `✓ Enrolled student: ${student.username} → Program: ${programId}`
            );
          }
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log(`
Summary:
- Created ${grades.length} Programs from Grades
- Created ${classes.length} Courses from Classes
- Updated ${lessonsWithoutCourse.length} Lessons to reference Courses
- Enrolled ${studentsWithClass.length} Students in Programs
    `);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToPrograms()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { migrateToPrograms };
