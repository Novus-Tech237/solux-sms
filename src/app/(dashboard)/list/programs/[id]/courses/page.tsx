import FormContainer from "@/components/FormContainer";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Course, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CourseWithTeacher extends Course {
  teacher: Teacher;
}

const ProgramCoursesPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const parsedProgramId = Number(params.id);

  if (!Number.isInteger(parsedProgramId) || parsedProgramId <= 0) {
    return notFound();
  }

  const programId = parsedProgramId;

  // Get program details
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!program) {
    return notFound();
  }

  const columns = [
    {
      header: "Course Name",
      accessor: "name",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Description",
      accessor: "description",
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: CourseWithTeacher) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">{item.teacher.name} {item.teacher.surname}</td>
      <td className="hidden lg:table-cell">{item.description || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="course" type="update" data={item} />
              <FormContainer table="course" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const parsedPage = page ? Number(page) : 1;
  const p = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const query: Prisma.CourseWhereInput = { programId };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.course.findMany({
      where: query,
      include: {
        teacher: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.course.count({ where: query }),
  ]);

  return (
    <>
      <div className="flex items-center gap-4 mb-4 pl-4 mt-4">
        <Link
          href="/list/programs"
          className="text-blue-500 hover:text-blue-700 font-medium text-sm"
        >
          ← Back to Programs
        </Link>
      </div>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">
            Courses - {program?.name}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {role === "admin" && (
                <FormContainer
                  table="course"
                  type="create"
                  data={{ programId }}
                />
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <Table columns={columns} renderRow={renderRow} data={data} />
        {/* PAGINATION */}
        <Pagination page={p} count={count} />
      </div>
    </>
  );
};

export default ProgramCoursesPage;
