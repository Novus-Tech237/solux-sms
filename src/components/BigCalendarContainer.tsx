import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId" | "programId" | "studentId" | "courseId";
  id: string | number;
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  let dataRes: any[];

  if (type === "programId") {
    // Get all courses in the program, then all lessons in those courses
    const courseIds = await prisma.course.findMany({
      where: { programId: id as number },
      select: { id: true },
    });

    dataRes = await prisma.lesson.findMany({
      where: {
        courseId: {
          in: courseIds.map((c) => c.id),
        },
      },
      include: {
        course: {
          select: { name: true },
        },
        teacher: {
          select: { name: true, surname: true },
        },
      },
    });
  } else if (type === "studentId") {
    // Get the student's active program enrollment
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: id as string,
        status: "ACTIVE",
      },
    });

    if (enrollment) {
      // Get the course registrations for this student in that program
      const registrations = await prisma.studentCourseRegistration.findMany({
        where: {
          studentId: id as string,
          course: {
            programId: enrollment.programId,
          },
        },
        select: {
          courseId: true,
        },
      });

      const registeredCourseIds = registrations.map((r) => r.courseId);

      dataRes = await prisma.lesson.findMany({
        where: {
          courseId: {
            in: registeredCourseIds,
          },
        },
        include: {
          course: {
            select: { name: true },
          },
          teacher: {
            select: { name: true, surname: true },
          },
        },
      });
    } else {
      dataRes = [];
    }
  } else if (type === "courseId") {
    dataRes = await prisma.lesson.findMany({
      where: {
        courseId: id as number,
      },
      include: {
        course: {
          select: { name: true },
        },
        teacher: {
          select: { name: true, surname: true },
        },
      },
    });
  } else {
    dataRes = await prisma.lesson.findMany({
      where: {
        ...(type === "teacherId" ? { teacherId: id as string } : {}),
      },
      include: {
        course: {
          select: { name: true },
        },
        teacher: {
          select: { name: true, surname: true },
        },
      },
    });
  }

  const data = dataRes.map((lesson: any) => ({
    id: lesson.id,
    title: lesson.course?.name || lesson.name,
    start: lesson.startTime,
    end: lesson.endTime,
    originalData: lesson,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  // Fetch related data for LessonForm if user clicks on an event
  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({
      where: role === "teacher" ? { teacherId: currentUserId! } : {},
      select: { id: true, name: true, teacherId: true, programId: true },
    }),
    prisma.teacher.findMany({
      where: type === "programId" ? {
        courses: {
          some: {
            programId: id as number
          }
        }
      } : {},
      select: { id: true, name: true, surname: true },
    }),
  ]);

  const relatedData = {
    courses,
    teachers,
    role,
    currentUserId,
  };

  return (
    <div className="">
      <BigCalendar
        data={schedule}
        role={role}
        currentUserId={currentUserId!}
        relatedData={relatedData}
      />
    </div>
  );
};

export default BigCalendarContainer;
