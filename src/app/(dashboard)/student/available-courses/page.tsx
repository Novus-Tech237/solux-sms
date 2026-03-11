"use client";

import { useState, useEffect } from "react";
import {
  getAvailablePrograms,
  enrollInProgram,
  getStudentProgramCoursesForRegistration,
  registerStudentCourse,
  unregisterStudentCourse,
} from "@/lib/actions";
import EnrollmentModal from "@/components/EnrollmentModal";
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

const AvailableCoursesPage = () => {
  const [programs, setPrograms] = useState<ProgramWithCourses[]>([]);
  const [activeRegistrationState, setActiveRegistrationState] =
    useState<ActiveProgramRegistrationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCourses | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [updatingCourseId, setUpdatingCourseId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [availablePrograms, registrationState] = await Promise.all([
          getAvailablePrograms(),
          getStudentProgramCoursesForRegistration(),
        ]);

        setPrograms(availablePrograms as ProgramWithCourses[]);
        setActiveRegistrationState(
          (registrationState as ActiveProgramRegistrationState | null) || null
        );
      } catch (err) {
        console.error("Failed to load student course data:", err);
        setMessage("Failed to load available programs and courses");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEnroll = async (programId: number) => {
    setEnrolling(true);
    setMessage("");
    try {
      const result = await enrollInProgram(programId);
      if (result.success) {
        setMessage("Successfully enrolled in program!");
        setTimeout(() => {
          window.location.href = "/student";
        }, 1500);
      } else {
        setMessage("Enrollment failed. Please try again.");
      }
    } catch (err) {
      setMessage("An error occurred during enrollment");
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCourseRegistration = async (
    courseId: number,
    isRegistered: boolean
  ) => {
    setUpdatingCourseId(courseId);
    setMessage("");

    try {
      const result = isRegistered
        ? await unregisterStudentCourse(courseId)
        : await registerStudentCourse(courseId);

      if (!result.success) {
        const errorMessage =
          "message" in result && typeof result.message === "string"
            ? result.message
            : undefined;
        setMessage(
          errorMessage || "Could not update course registration. Please try again."
        );
        return;
      }

      setActiveRegistrationState((prev) => {
        if (!prev) {
          return prev;
        }

        if (isRegistered) {
          return {
            ...prev,
            registeredCourseIds: prev.registeredCourseIds.filter(
              (registeredCourseId) => registeredCourseId !== courseId
            ),
          };
        }

        return {
          ...prev,
          registeredCourseIds: [...prev.registeredCourseIds, courseId],
        };
      });

      setMessage(
        isRegistered
          ? "Course removed from your registered courses."
          : "Course registered successfully."
      );
    } catch (err) {
      console.error(err);
      setMessage("An error occurred while updating course registration.");
    } finally {
      setUpdatingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          {activeRegistrationState?.program
            ? `Register Courses - ${activeRegistrationState.program.name}`
            : "Available Programs"}
        </h1>
        <p className="text-gray-600 mb-8">
          {activeRegistrationState?.program
            ? "You can register only courses that belong to your current program."
            : "Choose a program to enroll and then register its courses."}
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.includes("Successfully")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {!activeRegistrationState?.program && programs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No programs available at this moment.</p>
          </div>
        ) : activeRegistrationState?.program ? (
          <div className="space-y-4">
            {activeRegistrationState.program.courses.length === 0 ? (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-gray-500">No courses available in your current program.</p>
              </div>
            ) : (
              activeRegistrationState.program.courses.map((course) => {
                const isRegistered = activeRegistrationState.registeredCourseIds.includes(
                  course.id
                );

                return (
                  <div
                    key={course.id}
                    className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                      {course.description && (
                        <p className="mt-1 text-sm text-gray-600">{course.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Instructor: {course.teacher.name} {course.teacher.surname}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCourseRegistration(course.id, isRegistered)}
                      className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                        isRegistered
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                      disabled={updatingCourseId === course.id}
                    >
                      {updatingCourseId === course.id
                        ? "Saving..."
                        : isRegistered
                          ? "Unregister"
                          : "Register"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{program.name}</h3>
                  {program.description && (
                    <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Courses ({program.courses.length})
                    </p>
                    {program.courses.length > 0 ? (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {program.courses.slice(0, 3).map((course) => (
                          <li key={course.id} className="flex justify-between">
                            <span>{course.name}</span>
                            <span className="text-xs text-gray-500">
                              {course.teacher.name} {course.teacher.surname}
                            </span>
                          </li>
                        ))}
                        {program.courses.length > 3 && (
                          <li className="text-xs text-gray-500 italic">
                            +{program.courses.length - 3} more courses
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No courses yet</p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedProgram(program)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition-colors"
                    disabled={enrolling}
                  >
                    {enrolling ? "Enrolling..." : "Enroll"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProgram && (
        <EnrollmentModal
          program={selectedProgram}
          onConfirm={() => {
            handleEnroll(selectedProgram.id);
            setSelectedProgram(null);
          }}
          onCancel={() => setSelectedProgram(null)}
          isLoading={enrolling}
        />
      )}
    </div>
  );
};

export default AvailableCoursesPage;
