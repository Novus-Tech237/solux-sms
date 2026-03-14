"use client";

import CloudinaryUploader from "../CloudinaryUploader";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface AssignmentSubmissionFormProps {
  assignmentId: number;
  assignmentTitle: string;
  studentId: string;
  currentSubmissions: number;
  maxSubmissions: number;
  isSubmitted: boolean;
}

export default function AssignmentSubmissionForm({
  assignmentId,
  assignmentTitle,
  studentId,
  currentSubmissions,
  maxSubmissions,
  isSubmitted,
}: AssignmentSubmissionFormProps) {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "school";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFileUrl) {
      toast.error("Please upload your assignment file");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/assignment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          studentId,
          fileUrl: uploadedFileUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to submit assignment");
        return;
      }

      toast.success("Assignment submitted successfully!");
      setUploadedFileUrl("");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {assignmentTitle}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload your completed assignment
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Submissions: {currentSubmissions}/{maxSubmissions}
          {isSubmitted && <span className="text-green-600 dark:text-green-400 ml-2">✓ Final submission completed</span>}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Assignment Submission (PDF)
        </label>
        <CloudinaryUploader
          resourceType="raw"
          folder="school/assignment-submissions"
          preset={uploadPreset}
          onUpload={(url) => {
            setUploadedFileUrl(url);
            toast.success("File uploaded successfully");
          }}
        >
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Image src="/upload.png" alt="" width={32} height={32} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {uploadedFileUrl ? "PDF uploaded ✓" : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">PDF only</span>
          </div>
        </CloudinaryUploader>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !uploadedFileUrl || currentSubmissions >= maxSubmissions}
        className="bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {isSubmitting ? "Submitting..." : currentSubmissions >= maxSubmissions ? "Submission limit reached" : "Submit Assignment"}
      </button>
    </form>
  );
}
