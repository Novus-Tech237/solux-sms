import BigCalendar from "@/components/BigCalender";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Lesson } from "@prisma/client";

const StudentPage = async () => {
  const { userId } = auth();

  // Get the student's currently enrolled program
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: userId!,
      status: "ACTIVE",
    },
    include: {
      program: {
        include: {
          courses: {
            include: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  // Get lessons for courses explicitly registered by the student in the active program.
  let lessons: Pick<Lesson, "name" | "startTime" | "endTime">[] = [];
  if (enrollment?.program) {
    const registrations = await prisma.studentCourseRegistration.findMany({
      where: {
        studentId: userId!,
        course: {
          programId: enrollment.program.id,
        },
      },
      select: {
        courseId: true,
      },
    });

    const registeredCourseIds = registrations.map(
      (registration) => registration.courseId
    );

    lessons = await prisma.lesson.findMany({
      where: {
        courseId: { in: registeredCourseIds },
      },
      select: {
        name: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  const schedule = adjustScheduleToCurrentWeek(
    lessons.map((lesson) => ({
      title: lesson.name,
      start: lesson.startTime,
      end: lesson.endTime,
    }))
  );

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          {enrollment?.program ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">
                  Schedule - {enrollment.program.name}
                </h1>
                
              </div>
              {schedule.length > 0 ? (
                <BigCalendar data={schedule} />
              ) : (
                <p className="text-sm text-gray-500">
                  No lessons found. Register at least one course from your program.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No Program Enrolled</h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t enrolled in any program yet. Please choose a program to
                get started.
              </p>
              <Link
                href="/student/available-courses"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Browse Available Programs
              </Link>
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
