import { auth } from "@clerk/nextjs/server";
import {
  getAvailablePrograms,
  getStudentProgramCoursesForRegistration,
} from "@/lib/actions";
import AvailableCoursesListClient from "@/components/AvailableCoursesListClient";
import TableSearch from "@/components/TableSearch";
import Image from "next/image";
import { Program, Course } from "@prisma/client";

interface ProgramWithCourses extends Program {
  courses: (Course & {
    teacher: {
      name: string;
      surname: string;
    };
  })[];
}

interface ActiveProgramRegistrationState {
  program: ProgramWithCourses;
  registeredCourseIds: number[];
}

const AvailableCoursesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const { search } = searchParams;

  const [availablePrograms, registrationState] = await Promise.all([
    getAvailablePrograms(),
    getStudentProgramCoursesForRegistration(),
  ]);

  let programs = availablePrograms as ProgramWithCourses[];
  let activeRegistrationState = (registrationState as ActiveProgramRegistrationState | null) || null;

  // Search logic
  if (search) {
    if (activeRegistrationState) {
      activeRegistrationState.program.courses = activeRegistrationState.program.courses.filter(course => 
        course.name.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      programs = programs.filter(program => 
        program.name.toLowerCase().includes(search.toLowerCase())
      );
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold dark:text-gray-100">
          Available Courses/Programs
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow dark:bg-yellow-700">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow dark:bg-yellow-700">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* LIST */}
      <AvailableCoursesListClient 
        programs={programs} 
        activeRegistrationState={activeRegistrationState}
        role={role}
      />
    </div>
  );
};

export default AvailableCoursesPage;
