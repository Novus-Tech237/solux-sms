"use client";

import { useState } from "react";

interface AssignmentDownloadButtonProps {
  url: string;
  filename: string;
}

export default function AssignmentDownloadButton({
  url,
  filename,
}: AssignmentDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!url) return;
    try {
      setDownloading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
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

