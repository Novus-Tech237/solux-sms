import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Course, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import AssignmentDownloadButton from "@/components/AssignmentDownloadButton";

type AssignmentList = Assignment & {
  course: Course & { teacher: Teacher };
  submissions?: { id: number; grade?: string | null }[];
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Course", accessor: "course" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Due Date", accessor: "dueDate", className: "hidden md:table-cell" },
    { header: "PDF", accessor: "pdf" },
    ...(role === "student" ? [{ header: "Grade", accessor: "grade" }] : []),
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item: AssignmentList) => {
    const submission = item.submissions?.[0];

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{item.course.name}</td>
        <td className="hidden md:table-cell">
          {item.course.teacher.name + " " + item.course.teacher.surname}
        </td>
        <td className="hidden md:table-cell">
          {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
        </td>
        <td>
          {item.pdfUrl ? <AssignmentDownloadButton id={item.id} /> : "-"}
        </td>
        {role === "student" && (
          <td className="py-2">
            {!item.gradesReleased ? (
              // Grades not published yet — student sees nothing
              <span className="text-xs text-gray-300">—</span>
            ) : submission?.grade ? (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                submission.grade === "A" ? "bg-green-100 text-green-800" :
                submission.grade === "B_PLUS" || submission.grade === "B" ? "bg-blue-100 text-blue-800" :
                submission.grade === "C_PLUS" || submission.grade === "C" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {submission.grade.replace("_PLUS", "+")}
              </span>
            ) : submission ? (
              <span className="text-xs text-gray-400">Pending</span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )}
        <td>
          <div className="flex items-center gap-2">
            {role === "student" && (
              <Link
                href={`/list/assignments/assignment-submission?assignmentId=${item.id}`}
                className="text-xs bg-lamaSkyLight px-2 py-1 rounded-md"
              >
                {submission ? "Resubmit" : "Submit"}
              </Link>
            )}
            {role === "teacher" && (
              <Link
                href={`/teacher/submissions?type=assignment&id=${item.id}`}
                className="text-xs bg-lamaSkyLight px-2 py-1 rounded-md"
              >
                Submissions
              </Link>
            )}
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="assignment" type="update" data={item} />
                <FormContainer table="assignment" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AssignmentWhereInput = {};
  query.course = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "courseId":
            query.courseId = parseInt(value);
            break;
          case "teacherId":
            query.course.teacherId = value;
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { course: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.course.teacherId = currentUserId!;
      break;
    case "student":
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: { studentId: currentUserId!, status: "ACTIVE" },
        select: { programId: true },
      });

      if (enrollment) {
        const registrations = await prisma.studentCourseRegistration.findMany({
          where: {
            studentId: currentUserId!,
            course: { programId: enrollment.programId },
          },
          select: { courseId: true },
        });
        const courseIds = registrations.map((r) => r.courseId);
        query.courseId = { in: courseIds };
      } else {
        query.courseId = { in: [] };
      }
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        course: {
          select: {
            name: true,
            teacher: { select: { name: true, surname: true } },
          },
        },
        submissions: role === "student" ? {
          where: { studentId: currentUserId! },
          select: { id: true, grade: true },
        } : false,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);

  // Baseline for the polling button: only expose grades that have been published
  const initialGrades: Record<number, string | null> =
    role === "student"
      ? Object.fromEntries(
          data.map((item) => [
            item.id,
            item.gradesReleased ? (item.submissions?.[0]?.grade ?? null) : null,
          ])
        )
      : {};

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Assignments</h1>
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
              <FormContainer table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;