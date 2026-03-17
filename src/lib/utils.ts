import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// IT APPEARS THAT BIG CALENDAR SHOWS THE LAST WEEK WHEN THE CURRENT DAY IS A WEEKEND.
// FOR THIS REASON WE'LL GET THE LAST WEEK AS THE REFERENCE WEEK.
// IN THE TUTORIAL WE'RE TAKING THE NEXT WEEK AS THE REFERENCE WEEK.

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If today is Saturday (6) or Sunday (0), the calendar's WORK_WEEK usually shows the upcoming Mon-Fri.
  // We want to return the Monday of THAT week.
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (dayOfWeek === 0 ? 1 : 2));
    return nextMonday;
  }
  
  const daysSinceMonday = dayOfWeek - 1;
  const latestMonday = new Date(today);
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: any[]
): any[] => {
  const startOfWeek = getLatestMonday();
  const allOccurrences: any[] = [];

  // Generate occurrences for a broad range (e.g., 20 weeks before and 20 weeks after today)
  // to make the timetable feel truly periodic and visible in any week/day the user views.
  for (let i = -20; i <= 20; i++) {
    const currentWeekMonday = new Date(startOfWeek);
    currentWeekMonday.setDate(startOfWeek.getDate() + (i * 7));

    lessons.forEach((lesson) => {
      const lessonDayOfWeek = lesson.start.getDay();
      const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

      const adjustedStartDate = new Date(currentWeekMonday);
      adjustedStartDate.setDate(currentWeekMonday.getDate() + daysFromMonday);
      adjustedStartDate.setHours(
        lesson.start.getHours(),
        lesson.start.getMinutes(),
        lesson.start.getSeconds()
      );

      const adjustedEndDate = new Date(adjustedStartDate);
      adjustedEndDate.setHours(
        lesson.end.getHours(),
        lesson.end.getMinutes(),
        lesson.end.getSeconds()
      );

      allOccurrences.push({
        ...lesson,
        start: adjustedStartDate,
        end: adjustedEndDate,
      });
    });
  }

  return allOccurrences;
};
