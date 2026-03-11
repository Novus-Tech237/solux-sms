import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        courses: true,
        enrollments: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Failed to fetch programs:", error);
    return NextResponse.json(
      { message: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, semester, description } = body;

    if (!name || !semester) {
      return NextResponse.json(
        { message: "Program name and semester are required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.create({
      data: {
        name,
        semester,
        description,
        } as any,
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create program:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Program already exists for this semester" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create program" },
      { status: 500 }
    );
  }
}
