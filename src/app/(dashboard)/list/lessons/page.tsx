import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Course, Lesson, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Link from "next/link";
import TimetableFilter from "@/components/TimetableFilter";

type LessonList = Lesson & { course: Course } & {
  teacher: Teacher;
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, view = "calendar", ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Fetch courses and teachers for filters
  let filterData: {
    courses: { id: number; name: string }[];
    teachers: { id: string; name: string; surname: string }[];
  } = { courses: [], teachers: [] };

  if (role === "admin") {
    const [courses, teachers] = await Promise.all([
      prisma.course.findMany({ select: { id: true, name: true, teacherId: true, programId: true } }),
      prisma.teacher.findMany({ 
        where: queryParams.courseId ? {
          courses: {
            some: {
              id: parseInt(queryParams.courseId)
            }
          }
        } : {},
        select: { id: true, name: true, surname: true } 
      }),
    ]);
    filterData = { courses, teachers };
  } else if (role === "teacher") {
    const courses = await prisma.course.findMany({
      where: { teacherId: userId! },
      select: { id: true, name: true, teacherId: true, programId: true },
    });
    filterData = { courses, teachers: [] };
  }

  // ... rest of the columns, renderRow, query ... (keeping it)
  const columns = [
    {
      header: "Lesson Name",
      accessor: "name",
    },
    {
      header: "Course",
      accessor: "course",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: LessonList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td>{item.course.name}</td>
      <td className="hidden md:table-cell">
        {item.teacher.name + " " + item.teacher.surname}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="lesson" type="update" data={item} />
              <FormContainer table="lesson" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // URL PARAMS CONDITION
  const query: Prisma.LessonWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "courseId":
            query.courseId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
              { course: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  if (role === "teacher") {
    query.teacherId = userId!;
  }

  if (role === "student") {
    // Get the student's active program first.
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId!,
        status: "ACTIVE",
      },
      select: {
        programId: true,
      },
    });

    if (enrollment) {
      const registrations = await prisma.studentCourseRegistration.findMany({
        where: {
          studentId: userId!,
          course: {
            programId: enrollment.programId,
          },
        },
        select: {
          courseId: true,
        },
      });

      const courseIds = registrations.map((registration) => registration.courseId);
      query.courseId = { in: courseIds };
    } else {
      // If student has no enrolled program, return empty results
      query.courseId = { in: [] };
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        course: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lesson.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">Timetable</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-md">
            <Link
              href={`/list/lessons?view=calendar${queryParams.courseId ? `&courseId=${queryParams.courseId}` : ""}${queryParams.teacherId ? `&teacherId=${queryParams.teacherId}` : ""}`}
              className={`px-4 py-1 rounded-md text-sm ${view === "calendar" ? "bg-white shadow" : "text-gray-500"}`}
            >
              Calendar
            </Link>
            <Link
              href={`/list/lessons?view=list${queryParams.courseId ? `&courseId=${queryParams.courseId}` : ""}${queryParams.teacherId ? `&teacherId=${queryParams.teacherId}` : ""}`}
              className={`px-4 py-1 rounded-md text-sm ${view === "list" ? "bg-white shadow" : "text-gray-500"}`}
            >
              List
            </Link>
          </div>
          {view === "calendar" && (
            <TimetableFilter
              courses={filterData.courses}
              teachers={filterData.teachers}
              role={role!}
            />
          )}
          {view === "list" && <TableSearch />}
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer
                table="lesson"
                type="create"
                data={queryParams.courseId ? { courseId: parseInt(queryParams.courseId) } : {}}
              />
            )}
          </div>
        </div>
      </div>
      {/* CONTENT */}
      {view === "calendar" ? (
        <div className="min-h-[600px]">
          {role === "student" ? (
            <BigCalendarContainer type="studentId" id={userId!} />
          ) : queryParams.courseId ? (
            <BigCalendarContainer type="courseId" id={parseInt(queryParams.courseId)} />
          ) : queryParams.teacherId ? (
            <BigCalendarContainer type="teacherId" id={queryParams.teacherId} />
          ) : role === "teacher" ? (
            <BigCalendarContainer type="teacherId" id={userId!} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[600px] text-gray-500 gap-4">
              <p>Please select a course or teacher to view the timetable.</p>
              <div className="flex gap-4">
                 <p className="text-sm italic">Use the filter above to narrow down by Course or Teacher</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={data} />
          <Pagination page={p} count={count} />
        </>
      )}
    </div>
  );
};


export default LessonListPage;
