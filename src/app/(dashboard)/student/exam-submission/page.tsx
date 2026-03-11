import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import ExamSubmissionForm from "@/components/forms/ExamSubmissionForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const StudentExamSubmissionPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "student") {
    redirect("/");
  }

  const examId = searchParams.examId ? parseInt(searchParams.examId) : null;

  // Get student's active enrollment with program
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: userId,
      status: "ACTIVE",
    },
    include: {
      program: {
        include: {
          courses: true,
        },
      },
    },
  });

  if (!enrollment) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
        <p className="text-gray-600 dark:text-gray-400">
          You are not enrolled in any program.
        </p>
      </div>
    );
  }

  // Get course IDs for the student's program
  const courseIds = enrollment.program.courses.map((course) => course.id);

  // Get exams from courses in the student's program
  const exams = await prisma.exam.findMany({
    where: {
      lesson: {
        courseId: {
          in: courseIds,
        },
      },
    },
    include: {
      lesson: {
        select: {
          name: true,
          course: { select: { name: true } },
          teacher: { select: { name: true, surname: true } },
        },
      },
      submissions: {
        where: {
          studentId: userId,
        },
        select: {
          id: true,
          submittedAt: true,
          fileUrl: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  if (examId) {
    const exam = exams.find((e) => e.id === examId);

    if (!exam) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
          <p className="text-red-600">Exam not found.</p>
          <Link
            href="/list/exams"
            className="text-blue-600 dark:text-blue-400 underline mt-4 inline-block"
          >
            Back to Exams
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
        <Link
          href="/list/exams"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          <Image src="/back.png" alt="" width={16} height={16} />
          Back to Exams
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <ExamSubmissionForm
              examId={exam.id}
              examTitle={exam.title}
              studentId={userId}
            />
          </div>

          {/* Exam Details Section */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Exam Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Course</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {exam.lesson.course?.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Teacher</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {exam.lesson.teacher.name} {exam.lesson.teacher.surname}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Start Time</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(exam.startTime)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">End Time</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(exam.endTime)}
                </p>
              </div>

              {exam.pdfUrl && (
                <div>
                  <a
                    href={exam.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline text-xs"
                  >
                    View Exam PDF
                  </a>
                </div>
              )}

              {exam.submissions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
                    SUBMISSION STATUS
                  </p>
                  <p className="text-green-600 dark:text-green-400 font-medium mt-1">
                    ✓ Submitted
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(exam.submissions[0].submittedAt))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List all exams for student
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        My Exams
      </h1>

      <div className="space-y-4">
        {exams.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No exams available for your class.
          </p>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {exam.title}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Course</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {exam.lesson.course?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Teacher</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {exam.lesson.teacher.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {new Intl.DateTimeFormat("en-US").format(exam.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">End Date</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {new Intl.DateTimeFormat("en-US").format(exam.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {exam.submissions.length > 0 ? (
                    <>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded">
                        ✓ Submitted
                      </span>
                      <Link
                        href={`/student/exam-submission?examId=${exam.id}`}
                        className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded text-center hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                      >
                        Resubmit
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/student/exam-submission?examId=${exam.id}`}
                      className="text-xs bg-lamaSky dark:bg-blue-600 text-gray-800 dark:text-white px-3 py-1 rounded text-center hover:bg-lamaSkyLight dark:hover:bg-blue-700 transition"
                    >
                      Submit Exam
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentExamSubmissionPage;
