import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { makeCloudinaryUrlPublic } from "@/lib/cloudinary";

export async function POST() {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    select: { id: true, pdfUrl: true },
  });

  let count = 0;
  for (const a of assignments) {
    if (a.pdfUrl) {
      await makeCloudinaryUrlPublic(a.pdfUrl);
      count++;
    }
  }

  return NextResponse.json({ success: true, processed: count });
}
