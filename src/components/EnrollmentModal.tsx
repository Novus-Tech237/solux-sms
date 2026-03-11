"use client";

import React from "react";
import { Program, Course } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface EnrollmentModalProps {
  program: Program & {
    courses: (Course & {
      teacher: {
        name: string;
        surname: string;
      };
    })[];
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  program,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl">{program.name}</DialogTitle>
          {program.description && (
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {program.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mb-6 rounded bg-gray-50 p-4 dark:bg-gray-800">
          <h3 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">
            Courses ({program.courses.length})
          </h3>

          {program.courses.length > 0 ? (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {program.courses.map((course) => (
                <div key={course.id} className="text-sm">
                  <p className="font-medium text-gray-800 dark:text-gray-100">{course.name}</p>
                  {course.description && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {course.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
                    Instructor: {course.teacher.name} {course.teacher.surname}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No courses in this program yet</p>
          )}
        </div>

        <DialogFooter className="border-t pt-6">
          <button
            onClick={onCancel}
            className="mt-2 flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 sm:mt-0"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Enrolling..." : "Confirm Enrollment"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentModal;
