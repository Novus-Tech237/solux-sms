"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

interface CloudinaryUploaderProps {
  resourceType?: "image" | "raw" | "video";
  folder?: string;
  preset?: string;
  onUpload: (url: string) => void;
  children?: React.ReactNode;
  acceptedTypes?: string[];
}

export default function CloudinaryUploader({
  resourceType = "image",
  folder = "",
  preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "school",
  onUpload,
  children,
  acceptedTypes = ["application/pdf"],
}: CloudinaryUploaderProps) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const [loading, setLoading] = useState(false);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  if (!cloudName || !preset) {
    console.warn("CloudinaryUploader missing configuration", { cloudName, preset });
    return (
      <div className="text-red-500 text-xs">
        Upload not configured. Check environment variables.
      </div>
    );
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`);
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    form.append("resource_type", resourceType);
    if (folder) {
      form.append("folder", folder);
    }

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data?.error?.message || "Upload failed. Please try again.";
        console.error("Cloudinary error:", data);
        toast.error(errorMsg);
        return;
      }

      if (!data.secure_url) {
        console.warn("No secure_url in response:", data);
        toast.error("Upload succeeded but no URL returned.");
        return;
      }

      toast.success("File uploaded successfully!");
      onUpload(data.secure_url);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
        accept={acceptedTypes.join(",")}
      />
      {children || (
        <span className="text-blue-500 hover:underline">
          {loading ? "Uploading..." : "Choose file"}
        </span>
      )}
    </label>
  );
}
