import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        courses: true,
        enrollments: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to fetch program:", error);
    return NextResponse.json(
      { message: "Failed to fetch program" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { name, semester, description } = body;

    if (!name || !semester) {
      return NextResponse.json(
        { message: "Program name and semester are required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        name,
        semester,
        description,
        } as any,
    });

    return NextResponse.json(program);
  } catch (error: any) {
    console.error("Failed to update program:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Program already exists for this semester" },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Failed to update program" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);

    await prisma.program.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Program deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete program:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Failed to delete program" },
      { status: 500 }
    );
  }
}
