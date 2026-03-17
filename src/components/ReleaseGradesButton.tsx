"use client";

import { releaseAssignmentGrades } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState } from "react";

function ConfirmModal({
  type,
  onConfirm,
  onCancel,
  isLoading,
}: {
  type: "assignment" | "exam";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Release {type === "assignment" ? "Assignment" : "Exam"} Grades
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to release all{" "}
          <span className="font-medium text-gray-700">{type}</span> grades?
          Students will be notified and will be able to see their grades immediately.{" "}
          <span className="font-medium text-orange-600">This cannot be undone.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Releasing...
              </>
            ) : (
              "Yes, Release Grades"
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default function ReleaseGradesButton({
  assessmentId,
  courseId,
  type,
  alreadyReleased = false,
}: {
  assessmentId: number;
  courseId: number;
  type: "assignment" | "exam";
  alreadyReleased?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [released, setReleased] = useState(alreadyReleased);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result =
        type === "assignment"
          ? await releaseAssignmentGrades(assessmentId, courseId) : null
          // : await releaseExamGrades(assessmentId, courseId);

      if (result?.success) {
        toast.success(`${type === "assignment" ? "Assignment" : "Exam"} grades released to all students!`);
        setReleased(true);
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to release grades");
      }
    } catch (error) {
      toast.error("An error occurred while releasing grades");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Once released, replace the button with a static badge — can't be undone
  if (released) {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Grades Released
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
      >
        Release Grades
      </button>

      {showModal && (
        <ConfirmModal
          type={type}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}