import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { submissionId, type, grade } = await request.json();

    if (!submissionId || !type || !grade) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!["assignment", "exam"].includes(type)) {
      return new NextResponse("Invalid type", { status: 400 });
    }

    // Verify the teacher owns this submission
    if (type === "assignment") {
      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          assignment: {
            course: { teacherId: userId! },
          },
        },
      });

      if (!submission) {
        return new NextResponse("Submission not found or access denied", { status: 404 });
      }

      await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: { grade: grade as any },
      });
    } else {
      const submission = await prisma.examSubmission.findFirst({
        where: {
          id: submissionId,
          exam: {
            course: { teacherId: userId! },
          },
        },
      });

      if (!submission) {
        return new NextResponse("Submission not found or access denied", { status: 404 });
      }

      await prisma.examSubmission.update({
        where: { id: submissionId },
        data: { grade: grade as any },
      });
    }

    return new NextResponse("Grade saved successfully", { status: 200 });
  } catch (error) {
    console.error("Error saving grade:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}