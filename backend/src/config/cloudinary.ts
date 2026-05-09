import { v2 as cloudinary } from "cloudinary";
import env from "./env";
import logger from "./logger";

/* ======================================================
   CLOUDINARY CONFIGURATION

   Initializes the Cloudinary Node.js SDK with credentials
   from environment variables. This instance is used by
   the Multer storage engine and the delete utility.

   Docs: https://cloudinary.com/documentation/node_integration
====================================================== */

if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  logger.warn(
    "Cloudinary credentials not configured — file upload endpoints will not work. " +
    "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
  );
} else {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info(
    { cloudName: env.CLOUDINARY_CLOUD_NAME },
    "Cloudinary configured"
  );
}

export default cloudinary;
