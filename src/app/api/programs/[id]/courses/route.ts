import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = parseInt(params.id);
    const courses = await prisma.course.findMany({
      where: { programId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const programId = parseInt(params.id);
    const body = await req.json();
    const { name, description, teacherId } = body;

    if (!name || !teacherId) {
      return NextResponse.json(
        { message: "Course name and teacher are required" },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        description,
        programId,
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create course:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Course already exists in this program" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 }
    );
  }
}
