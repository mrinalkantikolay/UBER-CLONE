import cloudinary from "../config/cloudinary";
import logger from "../config/logger";

/* ======================================================
   CLOUDINARY DELETE UTILITY

   Helper to delete files from Cloudinary when:
   - A user replaces their profile photo (old one is deleted)
   - A driver deletes a compliance document

   Extracts the public_id from a Cloudinary URL and calls
   cloudinary.uploader.destroy(). Fails silently — a failed
   delete should not block the business operation.
====================================================== */

/**
 * Extract the Cloudinary public_id from a full URL.
 *
 * Cloudinary URLs follow the pattern:
 *   https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{filename}.{ext}
 *
 * The public_id is `{folder}/{filename}` (without extension).
 *
 * @param url - Full Cloudinary URL
 * @returns The public_id or null if the URL is not a Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);

    // Only process Cloudinary URLs
    if (!urlObj.hostname.includes("cloudinary.com")) {
      return null;
    }

    const pathParts = urlObj.pathname.split("/");

    // Find the 'upload' segment — everything after it (minus version) is the public_id
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Skip version segment (starts with 'v' followed by digits)
    let startIndex = uploadIndex + 1;
    if (startIndex < pathParts.length && /^v\d+$/.test(pathParts[startIndex])) {
      startIndex++;
    }

    // Join remaining parts and remove file extension
    const publicIdWithExt = pathParts.slice(startIndex).join("/");
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");

    return publicId || null;
  } catch {
    return null;
  }
};

/**
 * Delete a file from Cloudinary by its URL.
 *
 * Fails silently — a failed delete should not block
 * the business operation. Logs a warning on failure.
 *
 * @param url - Full Cloudinary URL of the file to delete
 * @param resourceType - 'image' | 'raw' | 'video' (default: 'image')
 */
export const deleteFromCloudinary = async (
  url: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<void> => {
  const publicId = extractPublicId(url);

  if (!publicId) {
    logger.debug({ url }, "Not a Cloudinary URL — skipping delete");
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      logger.info({ publicId }, "Cloudinary file deleted");
    } else {
      logger.warn({ publicId, result: result.result }, "Cloudinary delete returned non-ok result");
    }
  } catch (err) {
    // Fail silently — don't block the business operation
    logger.warn({ err, publicId, url }, "Failed to delete file from Cloudinary");
  }
};
