"use client";

import { useState } from "react";

interface AssignmentDownloadButtonProps {
  id: number;
}

export default function AssignmentDownloadButton({
  id,
}: AssignmentDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/assignments/download?id=${id}`);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;

      // Get filename from Content-Disposition if possible
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "assignment.pdf";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download assignment:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="text-xs text-blue-600 underline disabled:text-gray-400"
      disabled={downloading}
    >
      {downloading ? "Downloading..." : "Download"}
    </button>
  );
}

