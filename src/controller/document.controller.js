
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
        type: "upload",
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
// Get User Scope
// ==========================================

const getAttachmentScope = async (req) => {
  // ==========================================
  // Office Owner
  // ==========================================

  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    return {
      role: "office_owner",
      officeId: office._id,
      userId: req.user.id,
    };
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (req.user.role === "lawyer") {
    const user = await UserModel.findById(req.user.id).select("officeId");

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    return {
      role: "lawyer",
      officeId: user.officeId || null,
      userId: user._id,
    };
  }

  throw new AppError("غير مصرح لك بالوصول", 403);
};

// ==========================================
// Get Case According To User
// ==========================================

const getCaseByScope = async (caseId, scope) => {
  if (!caseId) {
    return null;
  }

  const filter = {
    _id: caseId,
  };

  // ==========================================
  // Office User
  // ==========================================

  if (scope.officeId) {
    filter.officeId = scope.officeId;
  }

  // ==========================================
  // Independent Lawyer
  // ==========================================

  else {
    filter.officeId = null;
    filter.lawyers = scope.userId;
  }

  return await caseModel.findOne(filter);
};

// ==========================================
// Get Client According To User
// ==========================================

const getClientByScope = async (clientId, scope) => {
  if (!clientId) {
    return null;
  }

  const filter = {
    _id: clientId,
  };

  // ==========================================
  // Office User
  // ==========================================

  if (scope.officeId) {
    filter.officeId = scope.officeId;
  }

  // ==========================================
  // Independent Lawyer
  // ==========================================

  else {
    filter.officeId = null;
    filter.createdBy = scope.userId;
  }

  return await ClientModel.findOne(filter);
};

// ==========================================
// Get Session According To User
// ==========================================

const getSessionByScope = async (sessionId, scope) => {
  if (!sessionId) {
    return null;
  }

  const filter = {
    _id: sessionId,
  };

  // ==========================================
  // Office User
  // ==========================================

  if (scope.officeId) {
    filter.officeId = scope.officeId;

    return await sessionModel.findOne(filter);
  }

  // ==========================================
  // Independent Lawyer
  // ==========================================

  const lawyerCases = await caseModel
    .find({
      officeId: null,
      lawyers: scope.userId,
    })
    .select("_id");

  const caseIds = lawyerCases.map((item) => item._id);

  filter.officeId = null;

  filter.caseId = {
    $in: caseIds,
  };

  return await sessionModel.findOne(filter);
};

// ==========================================
// Validate Case / Client / Session
// ==========================================

const validateRelationships = ({
  caseData,
  clientData,
  sessionData,
}) => {
  // ==========================================
  // Case + Client
  // ==========================================

  if (caseData && clientData) {
    if (
      caseData.clientId &&
      caseData.clientId.toString() !== clientData._id.toString()
    ) {
      throw new AppError("العميل لا يتبع القضية المحددة", 400);
    }
  }

  // ==========================================
  // Session + Case
  // ==========================================

  if (sessionData && caseData) {
    if (
      sessionData.caseId &&
      sessionData.caseId.toString() !== caseData._id.toString()
    ) {
      throw new AppError("الجلسة لا تتبع القضية المحددة", 400);
    }
  }
};

// ==========================================
// Add Attachment
// ==========================================

const handleAddAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("الملف مطلوب", 400);
    }

    const {
      caseId,
      clientId,
      sessionId,
      categoryId,
      name,
      description,
    } = req.body;

    // ==========================================
    // Basic Validation
    // ==========================================

    if (!categoryId) {
      throw new AppError("تصنيف الملف مطلوب", 400);
    }

    if (!name || !name.trim()) {
      throw new AppError("اسم الملف مطلوب", 400);
    }

    // ==========================================
    // Get Scope
    // ==========================================

    const scope = await getAttachmentScope(req);

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
    // Get Case
    // ==========================================

    let caseData = null;

    if (caseId) {
      caseData = await getCaseByScope(caseId, scope);

      if (!caseData) {
        throw new AppError(
          "القضية غير موجودة أو غير مصرح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Client
    // ==========================================

    let finalClientId = clientId || null;

    // ==========================================
    // If Case Exists
    // Get Client Automatically From Case
    // ==========================================

    if (caseData?.clientId) {
      finalClientId = caseData.clientId.toString();
    }

    // ==========================================
    // Get Client
    // ==========================================

    let clientData = null;

    if (finalClientId) {
      clientData = await getClientByScope(
        finalClientId,
        scope,
      );

      if (!clientData) {
        throw new AppError(
          "العميل غير موجود أو غير مصرح لك بالوصول إليه",
          404,
        );
      }
    }

    // ==========================================
    // Get Session
    // ==========================================

    let sessionData = null;

    if (sessionId) {
      sessionData = await getSessionByScope(
        sessionId,
        scope,
      );

      if (!sessionData) {
        throw new AppError(
          "الجلسة غير موجودة أو غير مصرح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Validate Relationships
    // ==========================================

    validateRelationships({
      caseData,
      clientData,
      sessionData,
    });

    // ==========================================
    // File Extension
    // ==========================================

    const extension = req.file.originalname.includes(".")
      ? req.file.originalname.substring(
          req.file.originalname.lastIndexOf("."),
        )
      : "";

    // ==========================================
    // Upload
    // ==========================================

    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
    );

    // ==========================================
    // Create Attachment
    // ==========================================

    const attachment = new AttachmentModel({
      officeId: scope.officeId,

      caseId: caseId || null,

      clientId: finalClientId,

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
      officeId: scope.officeId,

      caseId: attachment.caseId,

      clientId: attachment.clientId,

      sessionId: attachment.sessionId,

      attachmentId: attachment._id,

      type: "attachment_uploaded",

      title: "تم رفع مستند جديد",

      description: `تم رفع المستند "${attachment.name}"${
        caseData
          ? ` للقضية رقم ${caseData.caseNumber}`
          : ""
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
// Get All Documents
// ==========================================

const getDocumnts = async (req, res, next) => {
  try {
    const scope = await getAttachmentScope(req);

    let filter = {};

    // ==========================================
    // Office
    // ==========================================

    if (scope.officeId) {
      filter = {
        officeId: scope.officeId,
      };
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else {
      filter = {
        officeId: null,
        uploadedBy: scope.userId,
      };
    }

    const attachments = await AttachmentModel.find(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate(
        "sessionId",
        "sessionDate sessionTime",
      )
      .populate("categoryId", "name")
      .populate("uploadedBy", "name email")
      .sort({
        createdAt: -1,
      });

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

    const scope = await getAttachmentScope(req);

    const filter = {
      _id: id,
    };

    // ==========================================
    // Office
    // ==========================================

    if (scope.officeId) {
      filter.officeId = scope.officeId;
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else {
      filter.officeId = null;
      filter.uploadedBy = scope.userId;
    }

    const attachment = await AttachmentModel.findOne(
      filter,
    )
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate(
        "sessionId",
        "sessionDate sessionTime",
      )
      .populate("categoryId", "name")
      .populate("uploadedBy", "name email");

    if (!attachment) {
      throw new AppError(
        "لم يتم العثور على الملف",
        404,
      );
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

    const scope = await getAttachmentScope(req);

    const filter = {
      _id: id,
    };

    // ==========================================
    // Office
    // ==========================================

    if (scope.officeId) {
      filter.officeId = scope.officeId;
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else {
      filter.officeId = null;
      filter.uploadedBy = scope.userId;
    }

    // ==========================================
    // Find Attachment
    // ==========================================

    const attachment = await AttachmentModel.findOne(
      filter,
    );

    if (!attachment) {
      throw new AppError(
        "لم يتم العثور على الملف",
        404,
      );
    }

    // ==========================================
    // Get Case For Timeline
    // ==========================================

    let caseData = null;

    if (attachment.caseId) {
      caseData = await getCaseByScope(
        attachment.caseId,
        scope,
      );
    }

    // ==========================================
    // Delete From MongoDB
    // ==========================================

    await AttachmentModel.deleteOne({
      _id: attachment._id,
    });

    // ==========================================
    // Delete From Cloudinary
    // ==========================================

    if (attachment.publicId) {
      await deleteFromCloudinary(
        attachment.publicId,
      );
    }

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId: scope.officeId,

      caseId: attachment.caseId,

      clientId: attachment.clientId,

      sessionId: attachment.sessionId,

      attachmentId: attachment._id,

      type: "attachment_deleted",

      title: "تم حذف مستند",

      description: `تم حذف المستند "${attachment.name}"${
        caseData
          ? ` من القضية رقم ${caseData.caseNumber}`
          : ""
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

    const scope = await getAttachmentScope(req);

    const filter = {
      _id: id,
    };

    // ==========================================
    // Office
    // ==========================================

    if (scope.officeId) {
      filter.officeId = scope.officeId;
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else {
      filter.officeId = null;
      filter.uploadedBy = scope.userId;
    }

    // ==========================================
    // Find Attachment
    // ==========================================

    const attachment = await AttachmentModel.findOne(
      filter,
    );

    if (!attachment) {
      throw new AppError(
        "لم يتم العثور على الملف",
        404,
      );
    }

    const {
      name,
      categoryId,
      description,
      caseId,
      clientId,
      sessionId,
    } = req.body;

    // ==========================================
    // Name
    // ==========================================

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError(
          "اسم الملف مطلوب",
          400,
        );
      }

      attachment.name = name.trim();
    }

    // ==========================================
    // Description
    // ==========================================

    if (description !== undefined) {
      attachment.description =
        description?.trim() || "";
    }

    // ==========================================
    // Category
    // ==========================================

    if (categoryId !== undefined) {
      const category =
        await AttachmentCategoryModel.findOne({
          _id: categoryId,
          isActive: true,
        });

      if (!category) {
        throw new AppError(
          "تصنيف الملف غير موجود أو غير مفعل",
          404,
        );
      }

      attachment.categoryId = categoryId;
    }

    // ==========================================
    // Final Case
    // ==========================================

    const finalCaseId =
      caseId !== undefined
        ? caseId || null
        : attachment.caseId?.toString() || null;

    // ==========================================
    // Get Case
    // ==========================================

    let caseData = null;

    if (finalCaseId) {
      caseData = await getCaseByScope(
        finalCaseId,
        scope,
      );

      if (!caseData) {
        throw new AppError(
          "القضية غير موجودة أو غير مصرح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Final Client
    // ==========================================

    let finalClientId =
      clientId !== undefined
        ? clientId || null
        : attachment.clientId?.toString() || null;

    // ==========================================
    // Get Client Automatically From Case
    // ==========================================

    if (caseData?.clientId) {
      finalClientId =
        caseData.clientId.toString();
    }

    // ==========================================
    // Get Client
    // ==========================================

    let clientData = null;

    if (finalClientId) {
      clientData = await getClientByScope(
        finalClientId,
        scope,
      );

      if (!clientData) {
        throw new AppError(
          "العميل غير موجود أو غير مصرح لك بالوصول إليه",
          404,
        );
      }
    }

    // ==========================================
    // Final Session
    // ==========================================

    const finalSessionId =
      sessionId !== undefined
        ? sessionId || null
        : attachment.sessionId?.toString() || null;

    // ==========================================
    // Get Session
    // ==========================================

    let sessionData = null;

    if (finalSessionId) {
      sessionData = await getSessionByScope(
        finalSessionId,
        scope,
      );

      if (!sessionData) {
        throw new AppError(
          "الجلسة غير موجودة أو غير مصرح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Validate Relationships
    // ==========================================

    validateRelationships({
      caseData,
      clientData,
      sessionData,
    });

    // ==========================================
    // Update Relations
    // ==========================================

    attachment.caseId = finalCaseId;

    attachment.clientId = finalClientId;

    attachment.sessionId = finalSessionId;

    // ==========================================
    // Upload New File
    // ==========================================

    let oldPublicId = null;

    if (req.file) {
      oldPublicId = attachment.publicId;

      const cloudinaryResult =
        await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
        );

      const extension =
        req.file.originalname.includes(".")
          ? req.file.originalname.substring(
              req.file.originalname.lastIndexOf("."),
            )
          : "";

      attachment.originalName =
        req.file.originalname;

      attachment.url =
        cloudinaryResult.secure_url;

      attachment.publicId =
        cloudinaryResult.public_id;

      attachment.mimeType =
        req.file.mimetype;

      attachment.size = req.file.size;

      attachment.extension = extension;
    }

    // ==========================================
    // Save
    // ==========================================

    await attachment.save();

    // ==========================================
    // Delete Old Cloudinary File
    // ==========================================

    if (req.file && oldPublicId) {
      await deleteFromCloudinary(
        oldPublicId,
      );
    }

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم تعديل الملف بنجاح",
      attachment,
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
