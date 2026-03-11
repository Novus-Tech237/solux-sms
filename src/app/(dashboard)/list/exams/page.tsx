import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Course, Exam, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type ExamList = Exam & {
  lesson: {
    course: Course;
    teacher: Teacher;
  };
  submissions?: {
    id: number;
    studentId: string;
  }[];
};

const ExamListPage = async ({
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
    header: "Course",
    accessor: "course",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: ExamList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight dark:border-gray-700 dark:even:bg-gray-800 dark:hover:bg-gray-700"
  >
    <td className="flex items-center gap-4 p-4">{item.title}</td>
    <td className="dark:text-gray-100">{item.lesson.course.name}</td>
    <td className="hidden md:table-cell dark:text-gray-100">
      {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
    </td>
    <td className="hidden md:table-cell dark:text-gray-100">
      {new Intl.DateTimeFormat("en-US").format(item.startTime)}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "teacher" && (
          <Link
            href={`/teacher/submissions?type=exam&id=${item.id}`}
            className="text-xs bg-lamaSkyLight dark:bg-blue-700 px-2 py-1 rounded-md hover:opacity-80 transition"
          >
            Submissions
          </Link>
        )}
        {role === "student" && (
          <Link
            href={`/student/exam-submission?examId=${item.id}`}
            className={`text-xs px-3 py-1 rounded-md transition ${
              item.submissions && item.submissions.length > 0
                ? "bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                : "bg-lamaSky dark:bg-blue-600 text-gray-800 dark:text-white hover:bg-lamaSkyLight dark:hover:bg-blue-700"
            }`}
          >
            {item.submissions && item.submissions.length > 0
              ? "✓ Submitted"
              : "Submit"}
          </Link>
        )}
        {(role === "admin" || role === "teacher") && (
          <>
            <FormContainer table="exam" type="update" data={item} />
            <FormContainer table="exam" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ExamWhereInput = {};

  query.lesson = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "courseId":
            query.lesson.courseId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { lesson: { course: { name: { contains: value, mode: "insensitive" } } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      // Get the student's active program first.
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: currentUserId!,
          status: "ACTIVE",
        },
        select: {
          programId: true,
        },
      });

      if (enrollment) {
        const registrations = await prisma.studentCourseRegistration.findMany({
          where: {
            studentId: currentUserId!,
            course: {
              programId: enrollment.programId,
            },
          },
          select: {
            courseId: true,
          },
        });

        const courseIds = registrations.map((registration) => registration.courseId);
        query.lesson = {
          ...query.lesson,
          courseId: { in: courseIds },
        };
      } else {
        // If student has no enrolled program, return empty results
        query.lesson.courseId = { in: [] };
      }
      break;
    // parent role removed

    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            course: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
        ...(role === "student"
          ? {
              submissions: {
                where: { studentId: currentUserId! },
                select: { id: true, studentId: true },
              },
            }
          : {}),
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.exam.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="exam" type="create" />
            )}
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

export default ExamListPage;
