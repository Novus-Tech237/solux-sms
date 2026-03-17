import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import SubmissionViewer from "@/components/SubmissionViewer";
import ReleaseGradesButton from "@/components/ReleaseGradesButton";

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
  const submissionId = searchParams.submissionId
    ? Number(searchParams.submissionId)
    : null;

  // ─────────────────────────────────────────────
  // LANDING: no type/id → show all assignments + exams
  // ─────────────────────────────────────────────
  if (!type || !id) {
    const [assignments, exams] = await Promise.all([
      prisma.assignment.findMany({
        where: { course: { teacherId: userId! } },
        include: {
          course: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: "desc" },
      }),
      prisma.exam.findMany({
        where: { course: { teacherId: userId! } },
        include: {
          course: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { startTime: "desc" },
      }),
    ]);

    type Row = {
      kind: "assignment" | "exam";
      id: number;
      title: string;
      courseName: string;
      date: Date;
      submissionCount: number;
      gradesReleased: boolean;
    };

    const rows: Row[] = [
      ...assignments.map((a) => ({
        kind: "assignment" as const,
        id: a.id,
        title: a.title,
        courseName: a.course.name,
        date: a.dueDate,
        submissionCount: a._count.submissions,
        gradesReleased: a.gradesReleased,
      })),
      ...exams.map((e) => ({
        kind: "exam" as const,
        id: e.id,
        title: e.title,
        courseName: e.course.name,
        date: e.startTime,
        submissionCount: e._count.submissions,
        gradesReleased: false,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Submissions</h1>
          <p className="text-sm text-gray-500">All your assignments and exams</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4 hidden md:table-cell">Course</th>
                <th className="py-2 pr-4 hidden md:table-cell">Due Date</th>
                <th className="py-2 pr-4">Submissions</th>
                <th className="py-2 pr-4">Grades</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.kind}-${row.id}`}
                  className="border-b border-gray-200 even:bg-slate-50 hover:bg-lamaPurpleLight"
                >
                  <td className="py-2 pr-4 font-medium">{row.title}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.kind === "assignment"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {row.kind === "assignment" ? "Assignment" : "Exam"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 hidden md:table-cell text-gray-600">
                    {row.courseName}
                  </td>
                  <td className="py-2 pr-4 hidden md:table-cell text-gray-600">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(row.date)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{row.submissionCount}</span>
                    <span className="text-gray-400 ml-1 text-xs">
                      {row.submissionCount === 1 ? "submission" : "submissions"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {row.gradesReleased ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Released
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not released</span>
                    )}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/teacher/submissions?type=${row.kind}&id=${row.id}`}
                      className="text-xs bg-lamaSkyLight px-3 py-1.5 rounded-md hover:bg-lamaSky transition-colors whitespace-nowrap"
                    >
                      View Submissions
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="py-8 text-gray-400 text-center" colSpan={7}>
                    No assignments or exams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DETAIL: individual submission viewer
  // ─────────────────────────────────────────────
  if (!["assignment", "exam"].includes(type)) {
    return <div className="p-4">Invalid type.</div>;
  }

  if (submissionId) {
    if (type === "assignment") {
      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          id: submissionId,
          assignment: { id, course: { teacherId: userId! } },
        },
        include: {
          student: { select: { id: true, name: true, surname: true, username: true } },
          assignment: {
            select: { id: true, title: true, course: { select: { name: true } } },
          },
        },
      });

      if (!submission) return <div className="p-4">Submission not found.</div>;

      return (
        <SubmissionViewer
          submission={submission}
          type="assignment"
          onBackUrl={`/teacher/submissions?type=assignment&id=${id}`}
        />
      );
    } else {
      const submission = await prisma.examSubmission.findFirst({
        where: {
          id: submissionId,
          exam: { id, course: { teacherId: userId! } },
        },
        include: {
          student: { select: { id: true, name: true, surname: true, username: true } },
          exam: {
            select: { id: true, title: true, course: { select: { name: true } } },
          },
        },
      });

      if (!submission) return <div className="p-4">Submission not found.</div>;

      return (
        <SubmissionViewer
          submission={submission}
          type="exam"
          onBackUrl={`/teacher/submissions?type=exam&id=${id}`}
        />
      );
    }
  }

  // ─────────────────────────────────────────────
  // DETAIL: submission list for one assignment/exam
  // ─────────────────────────────────────────────
  if (type === "assignment") {
    const assignment = await prisma.assignment.findFirst({
      where: { id, course: { teacherId: userId! } },
      include: {
        course: { select: { name: true } },
        submissions: {
          include: {
            student: { select: { id: true, name: true, surname: true, username: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) return <div className="p-4">Assignment not found.</div>;

    const gradedCount = assignment.submissions.filter((s) => s.grade).length;
    const totalCount = assignment.submissions.length;

    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <Link
          href="/teacher/submissions"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to all submissions
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Assignment Submissions</h1>
            <p className="text-sm text-gray-500">
              {assignment.title} · {assignment.course.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {gradedCount}/{totalCount} graded
              {assignment.gradesReleased && (
                <span className="ml-2 text-green-600 font-medium">· Grades published</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <ReleaseGradesButton
              assessmentId={assignment.id}
              courseId={assignment.courseId}
              type="assignment"
              alreadyReleased={assignment.gradesReleased}
            />
            <a
              href={`/api/teacher/submissions/zip?type=assignment&id=${assignment.id}`}
              className="bg-lamaSky px-4 py-2 rounded-md text-sm"
            >
              Download ZIP
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Student</th>
                <th className="py-2">Username</th>
                <th className="py-2">Submitted At</th>
                <th className="py-2">Grade</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignment.submissions.map((submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="py-2">{submission.student.name} {submission.student.surname}</td>
                  <td className="py-2">{submission.student.username}</td>
                  <td className="py-2">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(submission.submittedAt)}
                  </td>
                  <td className="py-2">
                    {submission.grade ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        submission.grade === "A" ? "bg-green-100 text-green-800" :
                        submission.grade === "B_PLUS" || submission.grade === "B" ? "bg-blue-100 text-blue-800" :
                        submission.grade === "C_PLUS" || submission.grade === "C" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {submission.grade.replace("_PLUS", "+")}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not graded</span>
                    )}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/teacher/submissions?type=assignment&id=${id}&submissionId=${submission.id}`}
                      className="text-blue-600 underline text-sm"
                    >
                      View & Grade
                    </Link>
                  </td>
                </tr>
              ))}
              {assignment.submissions.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={5}>No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    return <div className="p-4">Exam submissions coming soon.</div>;
  }
};

export default TeacherSubmissionsPage;