"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const TimetableFilter = ({
  courses,
  teachers,
  role,
}: {
  courses: { id: number; name: string }[];
  teachers: { id: string; name: string; surname: string }[];
  role: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center">
      {role === "admin" && (
        <>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-xs bg-transparent outline-none"
            onChange={(e) => handleFilterChange("courseId", e.target.value)}
            value={searchParams.get("courseId") || ""}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-xs bg-transparent outline-none"
            onChange={(e) => handleFilterChange("teacherId", e.target.value)}
            value={searchParams.get("teacherId") || ""}
          >
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
        </>
      )}
      {role === "teacher" && (
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-xs bg-transparent outline-none"
          onChange={(e) => handleFilterChange("courseId", e.target.value)}
          value={searchParams.get("courseId") || ""}
        >
          <option value="">All My Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default TimetableFilter;
