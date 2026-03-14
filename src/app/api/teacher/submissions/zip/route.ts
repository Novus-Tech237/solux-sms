import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import JSZip from "jszip";

const getFileExtension = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split(".").pop();
    if (!extension || extension.length > 5) return "pdf";
    return extension;
  } catch {
    return "pdf";
  }
};

export async function GET(req: Request) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "teacher") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = Number(searchParams.get("id"));

  if (!type || !id || !["assignment", "exam"].includes(type)) {
    return new Response("Invalid request", { status: 400 });
  }

  const zip = new JSZip();

  if (type === "assignment") {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        course: { teacherId: userId },
      },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return new Response("Assignment not found", { status: 404 });
    }

    for (const submission of assignment.submissions) {
      try {
        const res = await fetch(submission.fileUrl);
        if (!res.ok) continue;
        const arrayBuffer = await res.arrayBuffer();
        const extension = getFileExtension(submission.fileUrl);
        zip.file(
          `${submission.student.username}_${submission.id}.${extension}`,
          arrayBuffer
        );
      } catch {
        continue;
      }
    }

    const archive = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(archive, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="assignment_${assignment.id}_submissions.zip"`,
      },
    });
  }

  const exam = await prisma.exam.findFirst({
    where: {
      id,
      course: { teacherId: userId },
    },
    include: {
      submissions: {
        include: {
          student: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    return new Response("Exam not found", { status: 404 });
  }

  for (const submission of exam.submissions) {
    try {
      const res = await fetch(submission.fileUrl);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      const extension = getFileExtension(submission.fileUrl);
      zip.file(`${submission.student.username}_${submission.id}.${extension}`, arrayBuffer);
    } catch {
      continue;
    }
  }

  const archive = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(archive, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="exam_${exam.id}_submissions.zip"`,
    },
  });
}
