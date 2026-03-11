import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    return notFound();
  }

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    include: {
      program: {
        include: {
          courses: true,
        },
      },
    },
  });

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex flex-col gap-4">
            {/* Top row: image + name/edit */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Image only */}
              <div className="w-full sm:w-auto flex flex-col items-center sm:items-start shrink-0">
                <Image
                  src={student.img || "/noAvatar.png"}
                  alt=""
                  width={144}
                  height={144}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover"
                />
              </div>
              {/* Name + edit button */}
             <div className="w-full min-w-0 flex flex-col justify-between gap-4">
  <div className="flex items-start justify-between gap-3">
    <div className="flex flex-col gap-1">
      <h1 className="text-lg md:text-xl font-semibold break-words">
        {student.name + " " + student.surname}
      </h1>
      <p className="text-sm text-gray-500">@{student.username}</p>
    </div>
    {role === "admin" && (
      <FormContainer table="student" type="update" data={student} />
    )}
  </div>
</div>
            </div>
            {/* Full-width contact info row */}
            <div className="rounded-md bg-white/50 p-3 text-xs md:text-sm w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{new Intl.DateTimeFormat("en-GB").format(student.birthday)}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="break-all">{student.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0 md:col-span-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span className="truncate">{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full">
              <Image src="/singleBranch.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{enrollment?.program?.name || "-"}</h1>
                <span className="text-sm text-gray-400">Program</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full">
              <Image src="/singleLesson.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{enrollment?.program?.courses?.length ?? 0}</h1>
                <span className="text-sm text-gray-400">Courses</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{enrollment ? "Enrolled" : "Not Enrolled"}</h1>
                <span className="text-sm text-gray-400">Status</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          {enrollment?.program ? (
            <BigCalendarContainer type="programId" id={enrollment.program.id} />
          ) : (
            <p className="text-sm text-gray-500">No program enrolled</p>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            {enrollment?.program && (
              <>
                <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/lessons`}>Student&apos;s Lessons</Link>
                <Link className="p-3 rounded-md bg-lamaPurpleLight" href={`/list/teachers`}>Student&apos;s Teachers</Link>
                <Link className="p-3 rounded-md bg-pink-50" href={`/list/exams`}>Student&apos;s Exams</Link>
                <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/assignments`}>Student&apos;s Assignments</Link>
              </>
            )}
            <Link className="p-3 rounded-md bg-lamaYellowLight" href={`/list/results?studentId=${student.id}`}>
              Student&apos;s Results
            </Link>
          </div>
        </div>
        <Performance />
      </div>
    </div>
  );
};

export default SingleStudentPage;