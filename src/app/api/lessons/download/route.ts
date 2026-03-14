import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSignedCloudinaryUrl, makeCloudinaryUrlPublic } from "@/lib/cloudinary";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "0");
  const type = url.searchParams.get("type") || "pdf"; // pdf or video

  if (!id) {
    return NextResponse.json({ message: "Missing lesson id" }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { pdfUrl: true, videoUrl: true, name: true },
  });

  if (!lesson) {
    return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
  }

  const fileUrl = type === "video" ? lesson.videoUrl : lesson.pdfUrl;
  if (!fileUrl) {
    return NextResponse.json({ message: `${type} not found for this lesson` }, { status: 404 });
  }

  try {
    console.log(`Fetching ${type} from Cloudinary:`, fileUrl);

    // First, try to ensure the file is public
    const madePublic = await makeCloudinaryUrlPublic(fileUrl);
    if (madePublic) {
      console.log(`Successfully made ${type} public`);
    }

    // Try fetching the file directly
    let fileRes = await fetch(fileUrl, {
      method: "GET",
    });

    // If 401, try with a signed URL
    if (fileRes.status === 401) {
      console.log(`Got 401, trying with signed URL for ${type}`);
      const signedUrl = generateSignedCloudinaryUrl(fileUrl);
      if (signedUrl) {
        fileRes = await fetch(signedUrl, {
          method: "GET",
        });
      }
    }

    console.log(`Cloudinary response status for ${type}:`, fileRes.status);

    const contentType = fileRes.headers.get("content-type") || "";

    // Check if Cloudinary returned JSON (error response)
    if (contentType.includes("application/json")) {
      const error = await fileRes.json();
      console.error(`Cloudinary returned JSON error for ${type}:`, error);
      return NextResponse.json(
        { message: "File access denied", error },
        { status: 403 }
      );
    }

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      console.error(
        `Failed to fetch ${type} from Cloudinary - Status:`,
        fileRes.status,
        "Error:",
        errorText
      );

      if (fileRes.status === 401) {
        return NextResponse.json(
          { message: `File access denied (401). ${type} may be restricted in Cloudinary.`, error: errorText },
          { status: 403 }
        );
      }

      if (fileRes.status === 404) {
        return NextResponse.json(
          { message: `${type} not found in Cloudinary` },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Failed to fetch file", error: errorText },
        { status: 500 }
      );
    }

    const buffer = await fileRes.arrayBuffer();
    const extension = type === "video" ? "mp4" : "pdf";
    const filename = `${lesson.name.replace(/\s+/g, "_")}.${extension}`;

    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      video: "video/mp4",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypeMap[type] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ message: "Download failed", error: String(err) }, { status: 500 });
  }
}
