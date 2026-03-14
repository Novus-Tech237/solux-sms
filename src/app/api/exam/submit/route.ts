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

    // Check current submission count for this student and exam
    const submissionCount = await prisma.examSubmission.count({
      where: {
        examId: parseInt(examId),
        studentId: userId,
      },
    });

    // Get exam maxSubmissions
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(examId) },
      select: { maxSubmissions: true },
    });

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found" },
        { status: 404 }
      );
    }

    const maxSubs = exam.maxSubmissions || 1; // default to 1 if not set

    if (submissionCount >= maxSubs) {
      return NextResponse.json(
        { message: "Maximum submissions reached" },
        { status: 400 }
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
