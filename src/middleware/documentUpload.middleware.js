import multer from "multer";

const storage = multer.memoryStorage();

const documentUpload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      // بعض العملاء مثل Postman قد يرسلوا الملفات بهذا النوع
      "application/octet-stream",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`نوع الملف غير مسموح: ${file.mimetype}`));
    }

    cb(null, true);
  },
});

export default documentUpload;
