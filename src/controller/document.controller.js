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
import AppError from "../utils/AppError.js";

// ==========================================
// Upload To Cloudinary
// ==========================================

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

// ==========================================
// Delete From Cloudinary
// ==========================================

const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};

// ==========================================
// Get Office ID
// ==========================================

const getOfficeId = async (req) => {
  // ==========================================
  // Office Owner
  // ==========================================

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

// ==========================================
// Add Attachment
// ==========================================

const handleAddAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("الملف مطلوب", 400);
    }

    const { caseId, clientId, sessionId, categoryId, name, description } =
      req.body;

    // ==========================================
    // Validate Category
    // ==========================================

    if (!categoryId) {
      throw new AppError("تصنيف الملف مطلوب", 400);
    }

    // ==========================================
    // Validate Name
    // ==========================================

    if (!name || !name.trim()) {
      throw new AppError("اسم الملف مطلوب", 400);
    }

    // ==========================================
    // Get Office ID
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك برفع الملفات", 403);
    }

    // ==========================================
    // Check Category
    // ==========================================

    const category = await AttachmentCategoryModel.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      throw new AppError("تصنيف الملف غير موجود أو غير مفعل", 404);
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
        throw new AppError("القضية غير موجودة داخل المكتب", 404);
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
        throw new AppError("العميل غير موجود داخل المكتب", 404);
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
        throw new AppError("الجلسة غير موجودة داخل المكتب", 404);
      }
    }

    // ==========================================
    // Check Case + Client Relationship
    // ==========================================

    if (caseData && clientData) {
      if (caseData.clientId.toString() !== clientData._id.toString()) {
        throw new AppError("العميل لا يتبع القضية المحددة", 400);
      }
    }

    // ==========================================
    // Check Session + Case Relationship
    // ==========================================

    if (sessionData && caseData) {
      if (sessionData.caseId.toString() !== caseData._id.toString()) {
        throw new AppError("الجلسة لا تتبع القضية المحددة", 400);
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
    // Save Attachment
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

    // ==========================================
    // Timeline
    // ==========================================

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
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Documents
// ==========================================

const getDocumnts = async (req, res, next) => {
  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بعرض الملفات", 403);
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
    next(error);
  }
};

// ==========================================
// Get Document By ID
// ==========================================

const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بعرض الملفات", 403);
    }

    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });

    if (!attachment) {
      throw new AppError("لم يتم العثور على الملف", 404);
    }

    return res.status(200).json({
      message: "تم جلب الملف بنجاح",
      attachment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Document
// ==========================================

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بحذف الملفات", 403);
    }

    // ==========================================
    // Find Attachment
    // ==========================================

    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });

    if (!attachment) {
      throw new AppError("لم يتم العثور على الملف", 404);
    }

    // ==========================================
    // Get Case
    // ==========================================

    let caseData = null;

    if (attachment.caseId) {
      caseData = await caseModel.findOne({
        _id: attachment.caseId,
        officeId,
      });
    }

    // ==========================================
    // Delete From MongoDB
    // ==========================================

    await AttachmentModel.findOneAndDelete({
      _id: id,
      officeId,
    });

    // ==========================================
    // Delete From Cloudinary
    // ==========================================

    if (attachment.publicId) {
      await deleteFromCloudinary(attachment.publicId);
    }

    // ==========================================
    // Timeline
    // ==========================================

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
    next(error);
  }
};

// ==========================================
// Update Document
// ==========================================

const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بتعديل الملفات", 403);
    }

    // ==========================================
    // Find Attachment
    // ==========================================

    const attachment = await AttachmentModel.findOne({
      _id: id,
      officeId,
    });

    if (!attachment) {
      throw new AppError("لم يتم العثور على الملف", 404);
    }

    const { name, categoryId, description, caseId, clientId, sessionId } =
      req.body;

    const updateData = {};

    // ==========================================
    // Name
    // ==========================================

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError("اسم الملف مطلوب", 400);
      }

      updateData.name = name.trim();
    }

    // ==========================================
    // Description
    // ==========================================

    if (description !== undefined) {
      updateData.description = description?.trim() || "";
    }

    // ==========================================
    // Category
    // ==========================================

    if (categoryId !== undefined) {
      const category = await AttachmentCategoryModel.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!category) {
        throw new AppError("تصنيف الملف غير موجود أو غير مفعل", 404);
      }

      updateData.categoryId = categoryId;
    }

    // ==========================================
    // Case
    // ==========================================

    let caseData = null;

    if (caseId !== undefined) {
      if (caseId) {
        caseData = await caseModel.findOne({
          _id: caseId,
          officeId,
        });

        if (!caseData) {
          throw new AppError("القضية غير موجودة داخل المكتب", 404);
        }

        updateData.caseId = caseId;
      } else {
        updateData.caseId = null;
      }
    }

    // ==========================================
    // Client
    // ==========================================

    let clientData = null;

    if (clientId !== undefined) {
      if (clientId) {
        clientData = await ClientModel.findOne({
          _id: clientId,
          officeId,
        });

        if (!clientData) {
          throw new AppError("العميل غير موجود داخل المكتب", 404);
        }

        updateData.clientId = clientId;
      } else {
        updateData.clientId = null;
      }
    }

    // ==========================================
    // Session
    // ==========================================

    let sessionData = null;

    if (sessionId !== undefined) {
      if (sessionId) {
        sessionData = await sessionModel.findOne({
          _id: sessionId,
          officeId,
        });

        if (!sessionData) {
          throw new AppError("الجلسة غير موجودة داخل المكتب", 404);
        }

        updateData.sessionId = sessionId;
      } else {
        updateData.sessionId = null;
      }
    }

    // ==========================================
    // Case + Client Relationship
    // ==========================================

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
        throw new AppError("العميل لا يتبع القضية المحددة", 400);
      }
    }

    // ==========================================
    // Session + Case Relationship
    // ==========================================

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
        throw new AppError("الجلسة لا تتبع القضية المحددة", 400);
      }
    }

    // ==========================================
    // Old Cloudinary Public ID
    // ==========================================

    const oldPublicId = attachment.publicId;

    // ==========================================
    // Upload New File
    // ==========================================

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

    // ==========================================
    // Update MongoDB
    // ==========================================

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

    if (!updatedAttachment) {
      throw new AppError("لم يتم العثور على الملف", 404);
    }

    // ==========================================
    // Delete Old File From Cloudinary
    // ==========================================

    if (req.file && oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return res.status(200).json({
      message: "تم تعديل الملف بنجاح",
      attachment: updatedAttachment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Export
// ==========================================

export {
  handleAddAttachment,
  getDocumnts,
  getDocumentById,
  deleteDocument,
  updateDocument,
};
