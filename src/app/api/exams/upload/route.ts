import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only admins/teachers should be able to upload exam PDFs
    if (!userId || (role !== "admin" && role !== "teacher")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "school/exams",
            resource_type: "raw",
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      }
    );

    const url = uploadResult.secure_url;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error("Exam PDF upload error:", error);
    return NextResponse.json(
      { message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

