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
    const { examId, fileUrl } = body;

    if (!examId || !fileUrl) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if student already submitted for this exam
    const existingSubmission = await prisma.examSubmission.findUnique({
      where: {
        examId_studentId: {
          examId: parseInt(examId),
          studentId: userId,
        },
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const updated = await prisma.examSubmission.update({
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
          message: "Exam resubmitted successfully",
          data: updated,
        },
        { status: 200 }
      );
    }

    // Create new submission
    const submission = await prisma.examSubmission.create({
      data: {
        examId: parseInt(examId),
        studentId: userId,
        fileUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Exam submitted successfully",
        data: submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Exam submission error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
