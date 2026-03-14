import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { assignmentId, fileUrl } = body;

    if (!assignmentId || !fileUrl) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check current submission count for this student and assignment
    const submissionCount = await prisma.assignmentSubmission.count({
      where: {
        assignmentId: parseInt(assignmentId),
        studentId: userId,
      },
    });

    // Get assignment maxSubmissions
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(assignmentId) },
      select: { maxSubmissions: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    const maxSubs = assignment.maxSubmissions || 1; // default to 1 if not set

    if (submissionCount >= maxSubs) {
      return NextResponse.json(
        { message: "Maximum submissions reached" },
        { status: 400 }
      );
    }

    // Determine status: if this will be the last allowed submission, set to SUBMITTED
    const newStatus = submissionCount + 1 >= maxSubs ? "SUBMITTED" : "DRAFT";

    // Create new submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: parseInt(assignmentId),
        studentId: userId,
        fileUrl,
        status: newStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Assignment submitted successfully",
        data: submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assignment submission error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
