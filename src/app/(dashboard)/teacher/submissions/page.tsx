import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const TeacherSubmissionsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "teacher") {
    return <div className="p-4">Only teachers can access this page.</div>;
  }

  const type = searchParams.type;
  const id = Number(searchParams.id);

  if (!type || !id || !["assignment", "exam"].includes(type)) {
    return <div className="p-4">Pick an assignment or exam to view submissions.</div>;
  }

  if (type === "assignment") {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        lesson: { teacherId: userId! },
      },
      include: {
        lesson: {
          select: {
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                surname: true,
                username: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return <div className="p-4">Assignment not found.</div>;
    }

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Assignment Submissions</h1>
            <p className="text-sm text-gray-500">
              {assignment.title} · {assignment.lesson.subject.name} · {assignment.lesson.class.name}
            </p>
          </div>
          <a
            href={`/api/teacher/submissions/zip?type=assignment&id=${assignment.id}`}
            className="bg-lamaSky px-4 py-2 rounded-md text-sm"
          >
            Download ZIP
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Student</th>
                <th className="py-2">Username</th>
                <th className="py-2">Submitted At</th>
                <th className="py-2">File</th>
              </tr>
            </thead>
            <tbody>
              {assignment.submissions.map((submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="py-2">{submission.student.name} {submission.student.surname}</td>
                  <td className="py-2">{submission.student.username}</td>
                  <td className="py-2">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(submission.submittedAt)}</td>
                  <td className="py-2">
                    <a href={submission.fileUrl} target="_blank" className="text-blue-600 underline">
                      View PDF
                    </a>
                  </td>
                </tr>
              ))}
              {assignment.submissions.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={4}>No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const exam = await prisma.exam.findFirst({
    where: {
      id,
      lesson: { teacherId: userId! },
    },
    include: {
      lesson: {
        select: {
          name: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!exam) {
    return <div className="p-4">Exam not found.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">Exam Submissions</h1>
          <p className="text-sm text-gray-500">
            {exam.title} · {exam.lesson.subject.name} · {exam.lesson.class.name}
          </p>
        </div>
        <a
          href={`/api/teacher/submissions/zip?type=exam&id=${exam.id}`}
          className="bg-lamaSky px-4 py-2 rounded-md text-sm"
        >
          Download ZIP
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Student</th>
              <th className="py-2">Username</th>
              <th className="py-2">Submitted At</th>
              <th className="py-2">File</th>
            </tr>
          </thead>
          <tbody>
            {exam.submissions.map((submission) => (
              <tr key={submission.id} className="border-b">
                <td className="py-2">{submission.student.name} {submission.student.surname}</td>
                <td className="py-2">{submission.student.username}</td>
                <td className="py-2">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(submission.submittedAt)}</td>
                <td className="py-2">
                  <a href={submission.fileUrl} target="_blank" className="text-blue-600 underline">
                    View PDF
                  </a>
                </td>
              </tr>
            ))}
            {exam.submissions.length === 0 && (
              <tr>
                <td className="py-3 text-gray-500" colSpan={4}>No submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/list/exams" className="text-sm underline text-gray-600">
          Back to exams
        </Link>
      </div>
    </div>
  );
};

export default TeacherSubmissionsPage;
