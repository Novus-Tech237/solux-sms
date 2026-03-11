import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type EventRecurrenceValue = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

const recurrenceLabel: Record<EventRecurrenceValue, string> = {
  NONE: "Don't Repeat",
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  YEARLY: "Every year",
};

type EventList = Event & {
  class: Class | null;
  occurrenceStart?: Date;
  occurrenceEnd?: Date;
};

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

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
      className: "hidden md:table-cell",
    },
    {
      header: "Recurrence",
      accessor: "recurrence",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(
          item.occurrenceStart || item.startTime
        )}
      </td>
      <td className="hidden md:table-cell">
        {(item.occurrenceStart || item.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {(item.occurrenceEnd || item.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {recurrenceLabel[item.recurrence as EventRecurrenceValue]}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const selectedDate = searchParams.date ? new Date(searchParams.date) : null;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  // Class no longer has a lessons relation, so only student-scoped class filtering is valid.
  if (role === "student") {
    query.OR = [
      { classId: null },
      {
        class: {
          students: {
            some: {
              id: currentUserId!,
            },
          },
        },
      },
    ];
  }

  let data: EventList[] = [];
  let count = 0;

  if (selectedDate && !Number.isNaN(selectedDate.getTime())) {
    const dayStart = toStartOfDay(selectedDate);
    const dayEnd = toEndOfDay(selectedDate);

    const rawEvents = await prisma.event.findMany({
      where: {
        ...query,
        startTime: {
          lte: dayEnd,
        },
      },
      include: {
        class: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const occurrences = rawEvents
      .filter((event) =>
        occursOnDate(
          event.startTime,
          event.recurrence as EventRecurrenceValue,
          selectedDate
        )
      )
      .map((event) => {
        const occurrenceStart = createOccurrenceDateTime(selectedDate, event.startTime);
        const durationMs = event.endTime.getTime() - event.startTime.getTime();
        const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);

        return {
          ...event,
          occurrenceStart,
          occurrenceEnd,
        };
      })
      .filter(
        (event) =>
          (event.occurrenceStart as Date) <= dayEnd &&
          (event.occurrenceEnd as Date) >= dayStart
      )
      .sort(
        (a, b) =>
          (a.occurrenceStart as Date).getTime() -
          (b.occurrenceStart as Date).getTime()
      );

    count = occurrences.length;
    data = occurrences.slice(ITEM_PER_PAGE * (p - 1), ITEM_PER_PAGE * p);
  } else {
    const result = await prisma.$transaction([
      prisma.event.findMany({
        where: query,
        include: {
          class: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.event.count({ where: query }),
    ]);

    data = result[0];
    count = result[1];
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="event" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;
