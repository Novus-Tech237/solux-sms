import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // cache results for 60 seconds

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const toEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const createOccurrenceDateTime = (targetDate: Date, sourceDateTime: Date) =>
  new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    sourceDateTime.getHours(),
    sourceDateTime.getMinutes(),
    sourceDateTime.getSeconds(),
    sourceDateTime.getMilliseconds()
  );

const differenceInDays = (later: Date, earlier: Date) =>
  Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));

type EventRecurrenceValue = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

const occursOnDate = (
  eventStart: Date,
  recurrence: EventRecurrenceValue,
  date: Date
) => {
  const normalizedEventStart = toStartOfDay(eventStart);
  const normalizedDate = toStartOfDay(date);

  if (normalizedDate < normalizedEventStart) {
    return false;
  }

  switch (recurrence) {
    case "NONE":
      return normalizedDate.getTime() === normalizedEventStart.getTime();
    case "DAILY":
      return true;
    case "WEEKLY": {
      const daysDiff = differenceInDays(normalizedDate, normalizedEventStart);
      return daysDiff % 7 === 0;
    }
    case "MONTHLY": {
      if (date.getDate() !== eventStart.getDate()) {
        return false;
      }

      const monthDiff =
        (date.getFullYear() - eventStart.getFullYear()) * 12 +
        (date.getMonth() - eventStart.getMonth());
      return monthDiff >= 0;
    }
    case "YEARLY":
      return (
        date.getMonth() === eventStart.getMonth() &&
        date.getDate() === eventStart.getDate() &&
        date.getFullYear() >= eventStart.getFullYear()
      );
    default:
      return normalizedDate.getTime() === normalizedEventStart.getTime();
  }
};

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = toStartOfDay(date);
  const dayEnd = toEndOfDay(date);

  // only load events that could possibly occur on or before the target day
  // - non‑recurring events that fall within the day
  // - any recurring event whose startTime is before the dayEnd
  const data = await prisma.event.findMany({
    where: {
      AND: [
        { startTime: { lte: dayEnd } },
        {
          OR: [
            { recurrence: "NONE", startTime: { gte: dayStart, lte: dayEnd } },
            { recurrence: { in: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] } },
          ],
        },
      ],
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const occurrences = data
    .filter((event) =>
      occursOnDate(event.startTime, event.recurrence as EventRecurrenceValue, date)
    )
    .map((event) => {
      const occurrenceStart = createOccurrenceDateTime(date, event.startTime);
      const durationMs = event.endTime.getTime() - event.startTime.getTime();
      const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        occurrenceStart: occurrenceStart.toISOString(),
        occurrenceEnd: occurrenceEnd.toISOString(),
      };
    })
    .filter(
      ({ occurrenceStart, occurrenceEnd }) =>
        new Date(occurrenceStart) <= dayEnd && new Date(occurrenceEnd) >= dayStart
    )
    .sort((a, b) => new Date(a.occurrenceStart).getTime() - new Date(b.occurrenceStart).getTime());

  return NextResponse.json(occurrences);
}
