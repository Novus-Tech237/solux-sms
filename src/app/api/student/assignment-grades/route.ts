import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId: userId, status: "ACTIVE" },
    select: { programId: true },
  });

  if (!enrollment) return NextResponse.json({ grades: {} });

  const registrations = await prisma.studentCourseRegistration.findMany({
    where: { studentId: userId, course: { programId: enrollment.programId } },
    select: { courseId: true },
  });

  const courseIds = registrations.map((r) => r.courseId);

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: userId, assignment: { courseId: { in: courseIds } } },
    select: {
      assignmentId: true,
      grade: true,
      assignment: { select: { gradesReleased: true } },
    },
  });

  // Only surface the grade if the teacher has published results
  const grades: Record<number, string | null> = {};
  for (const s of submissions) {
    grades[s.assignmentId] = s.assignment.gradesReleased ? (s.grade ?? null) : null;
  }

  return NextResponse.json({ grades });
}