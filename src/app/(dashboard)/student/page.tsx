import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const StudentPage = async () => {
  const { userId } = auth();

  // Get the student's currently enrolled program
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: userId!,
      status: "ACTIVE",
    },
    include: {
      program: true,
    },
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="bg-white p-4 rounded-md">
          {enrollment?.program ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">
                  Schedule - {enrollment.program.name}
                </h1>
              </div>
              <BigCalendarContainer type="studentId" id={userId!} />
            </>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No Program Enrolled</h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t enrolled in any program yet. Please choose a program to
                view your schedule.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
      <div className="bg-white p-4 rounded-md whitespace-nowrap">
            <h1 className="text-xl font-semibold">Shortcuts</h1>
            <div className="mt-4 flex flex-wrap gap-4 items-center text-xs text-gray-500">
                  <Link
                    href="/list/assignments"
                    className="p-3 rounded-md bg-red-100"
                  >
                    My Assignments
                  </Link>
                  <Link
                    href="/student/exam-submission"
                    className="p-3 rounded-md bg-green-100"
                  >
                    My Exams
                  </Link>
                  <Link
                    href="/student/available-courses"
                    className="p-3 rounded-md bg-purple-100"
                  >
                    Manage Program/Courses
                  </Link>
                </div>
          </div>
          <EventCalendarContainer />
          
      </div>
    </div>
  );
};

export default StudentPage;
