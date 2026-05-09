import multer, { FileFilterCallback } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Request } from "express";

import cloudinary from "../config/cloudinary";
import ApiError from "../utils/ApiError";

/* ======================================================
   UPLOAD MIDDLEWARE — Multer + Cloudinary Storage

   Two pre-configured Multer instances:
   1. uploadProfilePhoto — user profile pictures (5 MB, images only)
   2. uploadDocument     — driver compliance docs (10 MB, images + PDF)

   Files are uploaded directly to Cloudinary via the
   multer-storage-cloudinary engine — no local temp files.

   File validation:
   - MIME type checked in fileFilter
   - Size enforced via Multer's limits.fileSize
====================================================== */

/* ---- ALLOWED MIME TYPES ---- */

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_MIMES = [...IMAGE_MIMES, "application/pdf"];

/* ---- FILE FILTER FACTORY ---- */

const createFileFilter = (allowedMimes: string[]) => {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(", ")}`));
    }
  };
};

/* ======================================================
   1. PROFILE PHOTO UPLOAD
   - Max 5 MB
   - JPEG, PNG, WebP only
   - Auto-crop to 400×400, quality auto
   - Stored in: uber-clone/profile-photos/
====================================================== */

const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uber-clone/profile-photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  } as Record<string, unknown>,
});

export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: createFileFilter(IMAGE_MIMES),
}).single("photo");

/* ======================================================
   2. DOCUMENT UPLOAD
   - Max 10 MB
   - JPEG, PNG, WebP, PDF
   - No transformation (preserve original for OCR)
   - Stored in: uber-clone/driver-documents/
====================================================== */

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uber-clone/driver-documents",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    resource_type: "auto", // Supports both images and raw files (PDF)
  } as Record<string, unknown>,
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: createFileFilter(DOCUMENT_MIMES),
}).single("document");

/* ======================================================
   MULTER ERROR HANDLER MIDDLEWARE

   Catches Multer-specific errors (file too large, etc.)
   and converts them to ApiError for the global error handler.

   Usage: Place AFTER the multer middleware in the route chain.
   Or use the wrapped versions below.
====================================================== */

export const handleMulterError = (
  err: unknown,
  _req: Request,
  _res: unknown,
  next: Function
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "File too large. Maximum size exceeded."));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new ApiError(400, `Unexpected field: ${err.field}`));
    }
    return next(new ApiError(400, `Upload error: ${err.message}`));
  }
  next(err);
};
