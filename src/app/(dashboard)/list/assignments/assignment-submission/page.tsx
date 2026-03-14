import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import AssignmentSubmissionForm from "@/components/forms/AssignmentSubmissionForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const StudentAssignmentSubmissionPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "student") {
    redirect("/");
  }

  const assignmentId = searchParams.assignmentId ? parseInt(searchParams.assignmentId) : null;

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

  // Get assignments from courses in the student's program
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: {
        in: courseIds,
      },
    },
    include: {
      course: {
        select: {
          name: true,
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
          status: true,
        },
      },
      _count: {
        select: {
          submissions: {
            where: {
              studentId: userId,
            },
          },
        },
      },
    },
    orderBy: {
      dueDate: "desc",
    },
  });

  if (assignmentId) {
    const assignment = assignments.find((a) => a.id === assignmentId);

    if (!assignment) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
          <p className="text-red-600">Assignment not found.</p>
          <Link
            href="/list/assignments"
            className="text-blue-600 dark:text-blue-400 underline mt-4 inline-block"
          >
            Back to Assignments
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
        <Link
          href="/list/assignments"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          <ArrowLeft/>
          Back to Assignments
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <AssignmentSubmissionForm
              assignmentId={assignment.id}
              assignmentTitle={assignment.title}
              studentId={userId}
              currentSubmissions={assignment.submissions.length}
              maxSubmissions={assignment.maxSubmissions || 1}
              isSubmitted={assignment.submissions.some(s => s.status === "SUBMITTED")}
            />
          </div>

          {/* Assignment Details Section */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Assignment Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Course</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {assignment.course?.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Teacher</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {assignment.course?.teacher?.name} {assignment.course?.teacher?.surname}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Intl.DateTimeFormat("en-US").format(assignment.startDate)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Intl.DateTimeFormat("en-US").format(assignment.dueDate)}
                </p>
              </div>

              {assignment.pdfUrl && (
                <div>
                  <a
                    href={assignment.pdfUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline text-xs"
                  >
                    View Assignment PDF
                  </a>
                </div>
              )}

              {assignment.submissions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
                    SUBMISSION STATUS
                  </p>
                  <p className={`font-medium mt-1 ${
                    assignment.submissions.some(s => s.status === "SUBMITTED")
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}>
                    {assignment.submissions.some(s => s.status === "SUBMITTED")
                      ? "✓ Submitted"
                      : `Draft (${assignment.submissions.length}/${assignment.maxSubmissions || 1})`
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last submitted: {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(assignment.submissions[assignment.submissions.length - 1].submittedAt))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List all assignments for student
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        My Assignments
      </h1>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No assignments available for your classes.
          </p>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {assignment.title}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Course</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {assignment.course?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Teacher</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {assignment.course?.teacher?.name} {assignment.course?.teacher?.surname}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {new Intl.DateTimeFormat("en-US").format(assignment.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {new Intl.DateTimeFormat("en-US").format(assignment.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {assignment.submissions.length > 0 ? (
                    <>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded">
                        ✓ Submitted
                      </span>
                      <Link
                        href={`/student/assignment-submission?assignmentId=${assignment.id}`}
                        className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded text-center hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                      >
                        Resubmit
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/student/assignment-submission?assignmentId=${assignment.id}`}
                      className="text-xs bg-lamaSky dark:bg-blue-600 text-gray-800 dark:text-white px-3 py-1 rounded text-center hover:bg-lamaSkyLight dark:hover:bg-blue-700 transition"
                    >
                      Submit Assignment
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

export default StudentAssignmentSubmissionPage;
