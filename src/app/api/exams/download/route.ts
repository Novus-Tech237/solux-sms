import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSignedCloudinaryUrl, makeCloudinaryUrlPublic } from "@/lib/cloudinary";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "0");
  if (!id) {
    return NextResponse.json({ message: "Missing exam id" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id },
    select: { pdfUrl: true, title: true },
  });
  if (!exam || !exam.pdfUrl) {
    return NextResponse.json({ message: "Exam not found" }, { status: 404 });
  }

  try {
    console.log("Fetching exam PDF from Cloudinary:", exam.pdfUrl);

    // First, try to ensure the file is public
    const madePublic = await makeCloudinaryUrlPublic(exam.pdfUrl);
    if (madePublic) {
      console.log("Successfully made exam PDF public");
    }

    // Try fetching the file directly
    let fileRes = await fetch(exam.pdfUrl, {
      method: "GET",
    });

    // If 401, try with a signed URL
    if (fileRes.status === 401) {
      console.log("Got 401, trying with signed URL");
      const signedUrl = generateSignedCloudinaryUrl(exam.pdfUrl);
      if (signedUrl) {
        fileRes = await fetch(signedUrl, {
          method: "GET",
        });
      }
    }

    console.log("Cloudinary response status:", fileRes.status);

    const contentType = fileRes.headers.get("content-type") || "";

    // Check if Cloudinary returned JSON (error response)
    if (contentType.includes("application/json")) {
      const error = await fileRes.json();
      console.error("Cloudinary returned JSON error:", error);
      return NextResponse.json(
        { message: "File access denied", error },
        { status: 403 }
      );
    }

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      console.error(
        "Failed to fetch exam PDF from Cloudinary - Status:",
        fileRes.status,
        "Error:",
        errorText
      );

      if (fileRes.status === 401) {
        return NextResponse.json(
          { message: "File access denied (401). Exam PDF may be restricted in Cloudinary.", error: errorText },
          { status: 403 }
        );
      }

      if (fileRes.status === 404) {
        return NextResponse.json(
          { message: "Exam PDF not found in Cloudinary" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Failed to fetch file", error: errorText },
        { status: 500 }
      );
    }

    const buffer = await fileRes.arrayBuffer();
    const filename = `${exam.title.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ message: "Download failed", error: String(err) }, { status: 500 });
  }
}
