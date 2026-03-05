import BigCalendarContainer from "@/components/BigCalendarContainer";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const TeacherPage = () => {
  const { userId } = auth();
  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <div className="bg-white rounded-md p-4 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Teaching Workspace</h2>
          <Link href="/list/lessons" className="text-sm underline">
            Manage Lessons (PDF + optional video)
          </Link>
          <Link href="/list/assignments" className="text-sm underline">
            Manage Assignments (PDF + deadline)
          </Link>
          <Link href="/list/exams" className="text-sm underline">
            Manage Exams (PDF + deadline)
          </Link>
          <Link href="/teacher/submissions" className="text-sm underline">
            View Student Submissions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
