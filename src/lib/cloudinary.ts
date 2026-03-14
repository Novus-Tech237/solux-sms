import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const makeCloudinaryUrlPublic = async (url: string) => {
  try {
    const { publicId, publicIdWithExtension, resourceType } = getCloudinaryInfoFromUrl(url);
    if (!publicId) return false;

    // Try with both publicId (no extension) and publicIdWithExtension
    const idsToTry = [publicId];
    if (publicIdWithExtension !== publicId) {
      idsToTry.push(publicIdWithExtension);
    }

    let lastError = null;
    for (const id of idsToTry) {
      try {
        await cloudinary.uploader.explicit(id, {
          type: "upload",
          resource_type: resourceType || "raw",
          access_mode: "public",
        });
        return true; // Success with one of the IDs
      } catch (error) {
        lastError = error;
      }
    }

    console.error("Error making Cloudinary URL public (tried all IDs):", lastError);
    return false;
  } catch (error) {
    console.error("Error in makeCloudinaryUrlPublic:", error);
    return false;
  }
};

export const generateSignedCloudinaryUrl = (url: string) => {
  try {
    const { publicId, publicIdWithExtension, resourceType } = getCloudinaryInfoFromUrl(url);
    if (!publicId) return null;

    // For raw resources, we usually need the extension in the public ID if it was uploaded that way.
    // However, the private_download_url might be tricky.
    // Let's return the one that is more likely to work, or try to be smart.

    return cloudinary.utils.private_download_url(
      resourceType === "raw" ? publicIdWithExtension : publicId,
      "raw",
      {
        resource_type: resourceType || "raw",
        type: "upload",
      }
    );
  } catch (error) {
    console.error("Error generating signed Cloudinary URL:", error);
    return null;
  }
};

function getCloudinaryInfoFromUrl(url: string) {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/[cloud_name]/[resource_type]/[type]/[version]/[public_id].[extension]
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return { publicId: null, publicIdWithExtension: null, resourceType: null };

    const resourceType = parts[uploadIndex - 1];

    let publicIdParts = parts.slice(uploadIndex + 1);
    // Skip version part if present (v followed by digits)
    if (publicIdParts[0].startsWith("v") && /^\d+$/.test(publicIdParts[0].substring(1))) {
      publicIdParts = publicIdParts.slice(1);
    }

    const publicIdWithExtension = publicIdParts.join("/");

    let publicId = publicIdWithExtension;
    const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      publicId = publicIdWithExtension.substring(0, lastDotIndex);
    }

    return { publicId, publicIdWithExtension, resourceType };
  } catch (error) {
    return { publicId: null, publicIdWithExtension: null, resourceType: null };
  }
}
