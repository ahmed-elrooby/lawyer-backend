import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";

import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import sessionModel from "../models/session.model.js";
import AttachmentModel from "../models/document.model.js";
import AttachmentCategoryModel from "../models/attachmentCategories.model.js";
import createTimeLine from "../services/timeline.service.js";

const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const extension = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";

    const fileName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "lawyer-system/attachments",

        resource_type: "raw",

        public_id: `${Date.now()}-${fileName}${extension}`,
      },

      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};
const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};

const getOfficeId = async (req) => {
  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return null;
    }

    return office._id;
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (req.user.role === "lawyer") {
    const user = await UserModel.findById(req.user.id);

    if (!user || !user.officeId) {
      return null;
    }

    return user.officeId;
  }

  return null;
};

const handleAddAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "الملف مطلوب",
      });
    }

    // ==========================================
    // Get Body Data
    // ==========================================

    const { caseId, clientId, sessionId, categoryId, name, description } =
      req.body;

    // ==========================================
    // Validate Category
    // ==========================================

    if (!categoryId) {
      return res.status(400).json({
        message: "تصنيف الملف مطلوب",
      });
    }

    // ==========================================
    // Validate Name
    // ==========================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "اسم الملف مطلوب",
      });
    }

    // ==========================================
    // Get Office ID
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك برفع الملفات",
      });
    }

    // ==========================================
    // Check Category
    // ==========================================

    const category = await AttachmentCategoryModel.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "تصنيف الملف غير موجود أو غير مفعل",
      });
    }

    // ==========================================
    // Check Case
    // ==========================================

    let caseData = null;

    if (caseId) {
      caseData = await caseModel.findOne({
        _id: caseId,
        officeId,
      });

      if (!caseData) {
        return res.status(404).json({
          message: "القضية غير موجودة داخل المكتب",
        });
      }
    }

    // ==========================================
    // Check Client
    // ==========================================

    let clientData = null;

    if (clientId) {
      clientData = await ClientModel.findOne({
        _id: clientId,
        officeId,
      });

      if (!clientData) {
        return res.status(404).json({
          message: "العميل غير موجود داخل المكتب",
        });
      }
    }

    // ==========================================
    // Check Session
    // ==========================================

    let sessionData = null;

    if (sessionId) {
      sessionData = await sessionModel.findOne({
        _id: sessionId,
        officeId,
      });

      if (!sessionData) {
        return res.status(404).json({
          message: "الجلسة غير موجودة داخل المكتب",
        });
      }
    }

    // ==========================================
    // Check Case + Client Relationship
    // ==========================================

    if (caseData && clientData) {
      if (caseData.clientId.toString() !== clientData._id.toString()) {
        return res.status(400).json({
          message: "العميل لا يتبع القضية المحددة",
        });
      }
    }

    // ==========================================
    // Check Session + Case Relationship
    // ==========================================

    if (sessionData && caseData) {
      if (sessionData.caseId.toString() !== caseData._id.toString()) {
        return res.status(400).json({
          message: "الجلسة لا تتبع القضية المحددة",
        });
      }
    }

    // ==========================================
    // File Extension
    // ==========================================

    const extension = req.file.originalname.includes(".")
      ? req.file.originalname.substring(req.file.originalname.lastIndexOf("."))
      : "";

    // ==========================================
    // Upload To Cloudinary
    // ==========================================

    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
    );

    // ==========================================
    // Save Attachment In MongoDB
    // ==========================================

    const attachment = new AttachmentModel({
      officeId,

      caseId: caseId || null,

      clientId: clientId || null,

      sessionId: sessionId || null,

      categoryId,

      name: name.trim(),

      originalName: req.file.originalname,

      extension,

      url: cloudinaryResult.secure_url,

      publicId: cloudinaryResult.public_id,

      mimeType: req.file.mimetype,

      size: req.file.size,

      description: description?.trim() || "",

      uploadedBy: req.user.id,
    });

    await attachment.save();
    await createTimeLine({
      officeId,
      caseId: attachment.caseId,
      clientId: attachment.clientId,
      sessionId: attachment.sessionId,
      attachmentId: attachment._id,
      type: "attachment_uploaded",
      title: "تم رفع مستند جديد",
      description: `تم رفع المستند "${attachment.name}"${
        caseData ? ` للقضية رقم ${caseData.caseNumber}` : ""
      }`,
      createdBy: req.user.id,
    });
    // ==========================================
    // Response
    // ==========================================

    return res.status(201).json({
      message: "تم رفع الملف بنجاح",

      attachment,
    });
  } catch (e) {
    console.error("Attachment Upload Error:", e);

    // ==========================================
    // Invalid MongoDB ID
    // ==========================================

    if (e.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    // ==========================================
    // Validation Error
    // ==========================================

    if (e.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الملف غير صحيحة",
        error: e.message,
      });
    }

    // ==========================================
    // General Error
    // ==========================================

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",

      error: e.message,
    });
  }
};

const getDocumnts = async (req, res) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض الملفات",
      });
    }

    const attachments = await AttachmentModel.find({
      officeId,
    })
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("categoryId", "name")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "تم جلب الملفات بنجاح",
      count: attachments.length,
      attachments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    let officeId;
    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });
      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }
      officeId = office._id;
    }
    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);
      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }
      officeId = user.officeId;
    }
    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض الملفات",
      });
    }
    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });
    if (!attachment) {
      return res.status(404).json({
        message: "لم يتم العثور على الملف",
      });
    }
    return res.status(200).json({
      message: "تم جلب الملف بنجاح",
      attachment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطاء في السيرفر",
      error: error.message,
    });
  }
};
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بحذف الملفات",
      });
    }

    // البحث عن الملف داخل نفس المكتب
    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });

    if (!attachment) {
      return res.status(404).json({
        message: "لم يتم العثور على الملف",
      });
    }

    // لو الملف مرتبط بقضية، نجيب بيانات القضية
    let caseData = null;

    if (attachment.caseId) {
      caseData = await caseModel.findOne({
        _id: attachment.caseId,
        officeId,
      });
    }

    // حذف الملف من MongoDB
    await AttachmentModel.findOneAndDelete({
      _id: id,
      officeId,
    });

    // إضافة Timeline Event
    await createTimeLine({
      officeId,
      caseId: attachment.caseId,
      clientId: attachment.clientId,
      sessionId: attachment.sessionId,
      attachmentId: attachment._id,
      type: "attachment_deleted",
      title: "تم حذف مستند",
      description: `تم حذف المستند "${attachment.name}"${
        caseData ? ` من القضية رقم ${caseData.caseNumber}` : ""
      }`,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      message: "تم حذف الملف بنجاح",
      attachment,
    });
  } catch (error) {
    console.error("Delete Attachment Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بتعديل الملفات",
      });
    }

    // البحث عن الملف والتأكد أنه تابع للمكتب
    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });

    if (!attachment) {
      return res.status(404).json({
        message: "لم يتم العثور على الملف",
      });
    }

    const { name, categoryId, description, caseId, clientId, sessionId } =
      req.body;

    const updateData = {};

    // =========================
    // البيانات العادية
    // =========================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "اسم الملف مطلوب",
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || "";
    }

    // =========================
    // التحقق من Category
    // =========================

    if (categoryId !== undefined) {
      const category = await AttachmentCategoryModel.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!category) {
        return res.status(404).json({
          message: "تصنيف الملف غير موجود أو غير مفعل",
        });
      }

      updateData.categoryId = categoryId;
    }

    // =========================
    // التحقق من Case
    // =========================

    let caseData = null;

    if (caseId !== undefined) {
      if (caseId) {
        caseData = await caseModel.findOne({
          _id: caseId,
          officeId,
        });

        if (!caseData) {
          return res.status(404).json({
            message: "القضية غير موجودة داخل المكتب",
          });
        }

        updateData.caseId = caseId;
      } else {
        updateData.caseId = null;
      }
    }

    // =========================
    // التحقق من Client
    // =========================

    let clientData = null;

    if (clientId !== undefined) {
      if (clientId) {
        clientData = await ClientModel.findOne({
          _id: clientId,
          officeId,
        });

        if (!clientData) {
          return res.status(404).json({
            message: "العميل غير موجود داخل المكتب",
          });
        }

        updateData.clientId = clientId;
      } else {
        updateData.clientId = null;
      }
    }

    // =========================
    // التحقق من Session
    // =========================

    let sessionData = null;

    if (sessionId !== undefined) {
      if (sessionId) {
        sessionData = await sessionModel.findOne({
          _id: sessionId,
          officeId,
        });

        if (!sessionData) {
          return res.status(404).json({
            message: "الجلسة غير موجودة داخل المكتب",
          });
        }

        updateData.sessionId = sessionId;
      } else {
        updateData.sessionId = null;
      }
    }

    // =========================
    // التأكد أن Case و Client مرتبطين
    // =========================

    const finalCaseId =
      caseId !== undefined ? caseId : attachment.caseId?.toString();

    const finalClientId =
      clientId !== undefined ? clientId : attachment.clientId?.toString();

    if (finalCaseId && finalClientId) {
      if (!caseData) {
        caseData = await caseModel.findOne({
          _id: finalCaseId,
          officeId,
        });
      }

      if (!clientData) {
        clientData = await ClientModel.findOne({
          _id: finalClientId,
          officeId,
        });
      }

      if (
        caseData &&
        clientData &&
        caseData.clientId.toString() !== clientData._id.toString()
      ) {
        return res.status(400).json({
          message: "العميل لا يتبع القضية المحددة",
        });
      }
    }

    // =========================
    // التأكد أن Session تتبع Case
    // =========================

    const finalSessionId =
      sessionId !== undefined ? sessionId : attachment.sessionId?.toString();

    if (finalSessionId && finalCaseId) {
      if (!sessionData) {
        sessionData = await sessionModel.findOne({
          _id: finalSessionId,
          officeId,
        });
      }

      if (!caseData) {
        caseData = await caseModel.findOne({
          _id: finalCaseId,
          officeId,
        });
      }

      if (
        sessionData &&
        caseData &&
        sessionData.caseId.toString() !== caseData._id.toString()
      ) {
        return res.status(400).json({
          message: "الجلسة لا تتبع القضية المحددة",
        });
      }
    }

    // =========================
    // حفظ ID الملف القديم
    // =========================

    const oldPublicId = attachment.publicId;

    // =========================
    // لو فيه ملف جديد
    // =========================

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
      );

      const extension = req.file.originalname.includes(".")
        ? req.file.originalname.substring(
            req.file.originalname.lastIndexOf("."),
          )
        : "";

      updateData.originalName = req.file.originalname;
      updateData.url = cloudinaryResult.secure_url;
      updateData.publicId = cloudinaryResult.public_id;
      updateData.mimeType = req.file.mimetype;
      updateData.size = req.file.size;
      updateData.extension = extension;
    }

    // =========================
    // تحديث MongoDB
    // =========================

    const updatedAttachment = await AttachmentModel.findOneAndUpdate(
      {
        _id: id,
        officeId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    // =========================
    // حذف الملف القديم بعد نجاح التحديث
    // =========================

    if (req.file && oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return res.status(200).json({
      message: "تم تعديل الملف بنجاح",
      attachment: updatedAttachment,
    });
  } catch (error) {
    console.error("Attachment Update Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الملف غير صحيحة",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
export {
  handleAddAttachment,
  getDocumnts,
  getDocumentById,
  deleteDocument,
  updateDocument,
};
