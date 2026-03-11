import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId" | "programId";
  id: string | number;
}) => {
  let dataRes;

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
    });
  } else {
    dataRes = await prisma.lesson.findMany({
      where: {
        ...(type === "teacherId"
          ? { teacherId: id as string }
          : { classId: id as number }),
      },
    });
  }

  const data = dataRes.map((lesson) => ({
    title: lesson.name,
    start: lesson.startTime,
    end: lesson.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
