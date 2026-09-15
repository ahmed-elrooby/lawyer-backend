import multer from "multer";

const storage = multer.memoryStorage();

const documentUpload = multer({
  storage,

  fileFilter: (req, file, cb) => {
   const allowedTypes = [
  // PDF
  "application/pdf",

  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // Text
  "text/plain",
];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`نوع الملف غير مسموح: ${file.mimetype}`));
    }

    cb(null, true);
  },
});

export default documentUpload;
