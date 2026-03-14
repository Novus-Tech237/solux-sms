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

    // Check if student already submitted for this assignment
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: parseInt(assignmentId),
          studentId: userId,
        },
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const updated = await prisma.assignmentSubmission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          fileUrl,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Assignment resubmitted successfully",
          data: updated,
        },
        { status: 200 }
      );
    }

    // Create new submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: parseInt(assignmentId),
        studentId: userId,
        fileUrl,
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
