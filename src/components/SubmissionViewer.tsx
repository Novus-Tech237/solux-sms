"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Submission {
  id: number;
  fileUrl: string;
  submittedAt: Date;
  grade?: string | null;
  student: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
  assignment?: {
    id: number;
    title: string;
    course: { name: string };
  };
  exam?: {
    id: number;
    title: string;
    course: { name: string };
  };
}

interface SubmissionViewerProps {
  submission: Submission;
  type: "assignment" | "exam";
  onBackUrl: string;
}

const SubmissionViewer = ({ submission, type, onBackUrl }: SubmissionViewerProps) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(submission.grade || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const grades = [
    { value: "A", label: "A" },
    { value: "B_PLUS", label: "B+" },
    { value: "B", label: "B" },
    { value: "C_PLUS", label: "C+" },
    { value: "C", label: "C" },
    { value: "D_PLUS", label: "D+" },
    { value: "D", label: "D" },
    { value: "F", label: "F" },
  ];

  const handleGradeSubmit = async () => {
    if (!selectedGrade) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/teacher/submissions/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          type,
          grade: selectedGrade,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to save grade");
      }
    } catch (error) {
      alert("Error saving grade");
    } finally {
      setIsSaving(false);
    }
  };

  const item = submission.assignment || submission.exam;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={onBackUrl}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Image src="/back.png" alt="" width={16} height={16} />
          Back to Submissions
        </Link>
        <div className="text-right">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {type === "assignment" ? "Assignment" : "Exam"} Submission
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item?.title} · {item?.course.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Submission Preview
            </h3>
            <div className="w-full h-[600px] border border-gray-300 dark:border-gray-600 rounded">
              <iframe
                src={submission.fileUrl}
                className="w-full h-full rounded"
                title="Submission PDF"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition"
              >
                Open in New Tab
              </a>
              <a
                href={submission.fileUrl}
                download
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>

        {/* Grading Panel */}
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Student Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {submission.student.name} {submission.student.surname}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Username</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {submission.student.username}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Submitted At</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(submission.submittedAt))}
                </p>
              </div>
            </div>
          </div>

          {/* Grading */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Grade Submission
            </h3>

            {submission.grade && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Grade</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  submission.grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  submission.grade === 'B_PLUS' || submission.grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  submission.grade === 'C_PLUS' || submission.grade === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {submission.grade.replace('_PLUS', '+')}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Grade
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                >
                  <option value="">Select a grade...</option>
                  {grades.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGradeSubmit}
                disabled={!selectedGrade || isSaving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSaving ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewer;