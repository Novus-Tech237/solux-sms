"use client";

import { useState } from "react";
import Image from "next/image";
import { registerStudentCourse, enrollInProgram } from "@/lib/actions";
import Table from "./Table";
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

const AvailableCoursesListClient = ({
  programs,
  activeRegistrationState,
  role,
}: {
  programs: ProgramWithCourses[];
  activeRegistrationState: ActiveProgramRegistrationState | null;
  role: string | undefined;
}) => {
  const [updatingCourseId, setUpdatingCourseId] = useState<number | null>(null);
  const [enrollingProgramId, setEnrollingProgramId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: 'course' | 'program', id: number } | null>(null);

  const handleEnroll = async (programId: number) => {
    setEnrollingProgramId(programId);
    setMessage("");
    try {
      const result = await enrollInProgram(programId);
      if (result.success) {
        setMessage("Successfully enrolled in program!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage("Enrollment failed. Please try again.");
      }
    } catch (err) {
      setMessage("An error occurred during enrollment");
      console.error(err);
    } finally {
      setEnrollingProgramId(null);
      setShowConfirmModal(null);
    }
  };

  const handleCourseRegistration = async (courseId: number) => {
    setUpdatingCourseId(courseId);
    setMessage("");

    try {
      const result = await registerStudentCourse(courseId);

      if (result.success) {
        setMessage("Successfully registered for course!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorMessage =
          "message" in result && typeof result.message === "string"
            ? result.message
            : undefined;
        setMessage(errorMessage || "Could not update course registration.");
      }
    } catch (err) {
      setMessage("An error occurred during registration");
      console.error(err);
    } finally {
      setUpdatingCourseId(null);
      setShowConfirmModal(null);
    }
  };

  const programColumns = [
    { header: "Program Name", accessor: "name" },
    { header: "Description", accessor: "description", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const courseColumns = [
    { header: "Course Name", accessor: "name" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderProgramRow = (item: ProgramWithCourses) => (
    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700 text-sm hover:bg-lamaPurpleLight dark:hover:bg-gray-600">
      <td className="p-4">{item.name}</td>
      <td className="p-4 hidden md:table-cell">{item.description}</td>
      <td className="p-4">
        <button
          onClick={() => setShowConfirmModal({ type: 'program', id: item.id })}
          disabled={enrollingProgramId !== null}
          className="bg-lamaSky dark:bg-sky-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {enrollingProgramId === item.id ? "Enrolling..." : "Enroll"}
        </button>
      </td>
    </tr>
  );

  const renderCourseRow = (item: Course & { teacher: { name: string; surname: string } }) => {
    const isRegistered = activeRegistrationState?.registeredCourseIds.includes(item.id);
    return (
      <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700 text-sm hover:bg-lamaPurpleLight dark:hover:bg-gray-600">
        <td className="p-4">{item.name}</td>
        <td className="p-4 hidden md:table-cell">{item.teacher.name} {item.teacher.surname}</td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {isRegistered ? "Registered" : "Not Registered"}
          </span>
        </td>
        <td className="p-4">
          {!isRegistered && (
            <button
              onClick={() => setShowConfirmModal({ type: 'course', id: item.id })}
              disabled={updatingCourseId !== null}
              className="bg-lamaSky dark:bg-sky-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {updatingCourseId === item.id ? "Registering..." : "Register"}
            </button>
          )}
          {isRegistered && (
             <span className="text-gray-400 italic text-xs">Registration Definitive</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <div className={`p-4 rounded-md ${message.includes("failed") || message.includes("error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      {activeRegistrationState ? (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Available Courses in {activeRegistrationState.program.name}
          </h2>
          <Table columns={courseColumns} renderRow={renderCourseRow} data={activeRegistrationState.program.courses} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Available Programs</h2>
          <Table columns={programColumns} renderRow={renderProgramRow} data={programs} />
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-md max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Confirm Registration</h2>
            <p className="mb-6 dark:text-gray-300">
              Are you sure you want to register for this {showConfirmModal.type}? This action is **definitive** and cannot be undone from this portal.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md dark:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirmModal.type === 'program') {
                    handleEnroll(showConfirmModal.id);
                  } else {
                    handleCourseRegistration(showConfirmModal.id);
                  }
                }}
                className="px-4 py-2 bg-lamaSky dark:bg-sky-700 text-white rounded-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableCoursesListClient;
