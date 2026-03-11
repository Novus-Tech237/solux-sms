# Migration Guide: Class-to-Program Enrollment System

This guide walks through migrating your existing class-based student assignments to the new program-based enrollment system.

## Overview

The migration converts:
- **Grades** → **Programs** (each grade level becomes a program)
- **Classes** → **Courses** (each class becomes a course within its grade's program)
- **Student classId assignments** → **StudentEnrollment records** (automatic enrollment with ACTIVE status)
- **Lessons** → Updated to reference courses instead of classes

## Prerequisites

- ✅ Database schema updated (Prisma migration applied)
- ✅ Middleware and routes deployed
- ✅ New components deployed
- ✅ Backup of database created (recommended for production)

## Running the Migration

### Step 1: Verify Database State

```bash
# Check current schema
npx prisma studio

# Verify Grade, Class, and Student records exist
```

### Step 2: Run the Migration Script

```bash
# Using ts-node (requires ts-node installed)
npx ts-node prisma/migrateToPrograms.ts

# Or add to package.json scripts:
# "scripts": { "migrate-to-programs": "ts-node prisma/migrateToPrograms.ts" }
```

### Step 3: Verify Migration Results

The script outputs a summary like:
```
Summary:
- Created 6 Programs from Grades
- Created 24 Courses from Classes
- Updated 156 Lessons to reference Courses
- Enrolled 512 Students in Programs
```

### Step 4: Validate Data Integrity

```bash
# Check programs were created
SELECT COUNT(*) FROM "Program"

# Check courses were created
SELECT COUNT(*) FROM "Course"

# Check student enrollments
SELECT COUNT(*) FROM "StudentEnrollment"

# Verify lessons have courseId
SELECT COUNT(*) FROM "Lesson" WHERE "courseId" IS NOT NULL
```

## What the Script Does

### 1. **Create Programs from Grades**
   - For each unique grade level, creates a Program
   - Example: Grade 1 → "Grade 1 Program"
   - Maintains mapping of gradeId → programId

### 2. **Create Courses from Classes**
   - For each Class, creates a Course
   - Course assigned to its students' grade's Program
   - Teacher/supervisor assigned as course instructor
   - Falls back to first available teacher if no supervisor exists

### 3. **Update Lessons to Reference Courses**
   - Any Lesson without a courseId gets assigned to first available course
   - Preserves lesson data (name, description, content, etc.)
   - Only updates the courseId foreign key

### 4. **Create Student Enrollments**
   - For each Student with classId + gradeId
   - Creates StudentEnrollment record with status = ACTIVE
   - Links student to their grade's Program
   - Prevents duplicate enrollments (checks before creating)

## Rollback Procedure

If you need to rollback:

```bash
# Option 1: Restore from backup
# (Recommended: always backup before production migration)

# Option 2: Manual cleanup (if no backup)
DELETE FROM "StudentEnrollment"
DELETE FROM "Course"  
DELETE FROM "Program"
# Then re-run CreateLesson commands with classId

# Option 3: Reset to previous Prisma migration
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma db push
```

## Post-Migration Next Steps

### 1. **Test Student Views**
   - Student dashboard should show enrolled program
   - `/list/lessons` should show only enrolled program's lessons
   - `/student/available-courses` should show all programs

### 2. **Verify Teacher Views**
   - Teachers should see their assigned courses
   - Can create lessons linked to courses
   - Can create assignments and exams

### 3. **Test Admin Features**
   - Admin can view all programs
   - Admin can manage courses within programs
   - Admin can create new programs/courses

### 4. **Verify Permissions**
   - Students see content only from enrolled program
   - Teachers see only their assigned courses
   - Admins see all programs and courses

## Troubleshooting

### Issue: "No teachers available for course"
**Solution:** The script requires at least one teacher record. Create a teacher first:
```prisma
mutation {
  createTeacher {
    name: "Admin Teacher"
    surname: "Default"
    email: "teacher@school.edu"
  }
}
```

### Issue: "No programs available"  
**Solution:** Script should auto-create a "Default Program" but check Grades exist:
```sql
SELECT COUNT(*) FROM "Grade"
```

### Issue: Migration ran but data incomplete
**Solution:** Check Prisma Client is fresh:
```bash
rm -rf node_modules/.prisma/client
npx prisma generate
```

### Issue: StudentEnrollment table has duplicates
**Solution:** Script includes duplicate check, but manually remove:
```sql
DELETE FROM "StudentEnrollment" WHERE id IN (
  SELECT id FROM "StudentEnrollment" 
  WHERE ROW_NUMBER() OVER (PARTITION BY "studentId", "programId" ORDER BY id) > 1
)
```

## Performance Notes

- Script processes 100+ students and classes efficiently
- For 10,000+ students: Consider batching in loop with `skipDuplicates: true`
- For very large databases: Run during maintenance window

## Support

If migration fails:
1. Check database logs: `npx prisma studio`
2. Verify Prisma version: `npx prisma -v` (should be 5.22.0+)
3. Check connection string in `.env.local`
4. Review script output for specific error messages

---

**Migration completed?** ✅  
Next: Test the complete flow [see testing guide]
