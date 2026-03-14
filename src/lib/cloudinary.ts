import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const makeCloudinaryUrlPublic = async (url: string) => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return false;

    await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: "raw",
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
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return null;

    return cloudinary.utils.private_download_url(publicId, "raw", {
      resource_type: "raw",
      type: "upload",
    });
  } catch (error) {
    console.error("Error generating signed Cloudinary URL:", error);
    return null;
  }
};

function getPublicIdFromUrl(url: string) {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/[cloud_name]/[resource_type]/[type]/[version]/[public_id].[extension]
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Public ID is everything after the version (which starts with 'v')
    const remainingParts = parts.slice(uploadIndex + 2);
    const lastPart = remainingParts[remainingParts.length - 1];
    const lastPartWithoutExtension = lastPart.split(".")[0];
    
    remainingParts[remainingParts.length - 1] = lastPartWithoutExtension;
    return remainingParts.join("/");
  } catch (error) {
    return null;
  }
}
