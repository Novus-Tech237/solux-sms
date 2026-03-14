import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const makeCloudinaryUrlPublic = async (url: string) => {
  try {
    const { publicId, resourceType } = getCloudinaryInfoFromUrl(url);
    if (!publicId) return false;

    await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: resourceType || "raw",
      access_mode: "public",
    });
    return true;
  } catch (error) {
    console.error("Error making Cloudinary URL public:", error);
    return false;
  }
};

export const generateSignedCloudinaryUrl = (url: string) => {
  try {
    const { publicId, resourceType } = getCloudinaryInfoFromUrl(url);
    if (!publicId) return null;

    return cloudinary.utils.private_download_url(publicId, "raw", {
      resource_type: resourceType || "raw",
      type: "upload",
    });
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
    if (uploadIndex === -1) return { publicId: null, resourceType: null };

    const resourceType = parts[uploadIndex - 1];

    let publicIdParts = parts.slice(uploadIndex + 1);
    // Skip version part if present
    if (publicIdParts[0].startsWith("v") && /^\d+$/.test(publicIdParts[0].substring(1))) {
      publicIdParts = publicIdParts.slice(1);
    }

    const publicIdWithExtension = publicIdParts.join("/");

    // For images and videos, Cloudinary often expects public ID WITHOUT extension.
    // For 'raw' resources, it expects it WITH extension.
    let publicId = publicIdWithExtension;
    if (resourceType === "image" || resourceType === "video") {
      const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        publicId = publicIdWithExtension.substring(0, lastDotIndex);
      }
    }

    return { publicId, resourceType };
  } catch (error) {
    return { publicId: null, resourceType: null };
  }
}
