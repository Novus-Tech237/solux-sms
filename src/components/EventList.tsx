import prisma from "@/lib/prisma";

type EventRecurrenceValue = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

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

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = toStartOfDay(date);
  const dayEnd = toEndOfDay(date);

  const data = await prisma.event.findMany({
    where: {
      startTime: {
        lte: dayEnd,
      },
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
        event,
        occurrenceStart,
        occurrenceEnd,
      };
    })
    .filter(
      ({ occurrenceStart, occurrenceEnd }) =>
        occurrenceStart <= dayEnd && occurrenceEnd >= dayStart
    )
    .sort(
      (a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime()
    );

  return occurrences.map(({ event, occurrenceStart }) => (
    <div
      className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
      key={event.id}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-600">{event.title}</h1>
        <span className="text-gray-300 text-xs">
          {occurrenceStart.toLocaleTimeString("en-UK", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
    </div>
  ));
};

export default EventList;
