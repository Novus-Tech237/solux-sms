import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


const ParentPage = async () => {
  const { userId } = auth();
  const currentUserId = userId;
  
  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId!,
    },
  });

  // Get enrollments for all students
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      status: "ACTIVE",
    },
    include: {
      program: true,
    },
  });

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="">
        {students.map((student) => {
          const enrollment = enrollments.find((e) => e.studentId === student.id);
          return (
            <div className="w-full xl:w-2/3" key={student.id}>
              <div className="h-full bg-white p-4 rounded-md">
                <h1 className="text-xl font-semibold">
                  Schedule ({student.name + " " + student.surname})
                </h1>
                {enrollment?.program ? (
                  <BigCalendarContainer type="programId" id={enrollment.program.id} />
                ) : (
                  <p className="text-sm text-gray-500">Student not enrolled in any program</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
