import cloudinary from "../config/cloudinary.js";

import UserModel from "../models/User.model.js";
import OfficeModel from "../models/office.model.js";

import AppError from "../utils/AppError.js";

// ==========================================
// Create Lawyer
// ==========================================

const createLawyer = async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  try {
    // ==========================================
    // Get Office
    // ==========================================

    const office = await OfficeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    // ==========================================
    // Profile Image
    // ==========================================

    let profileImage = {
      url: null,
      publicId: null,
    };

    // ==========================================
    // Upload Profile Image
    // ==========================================

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "lawyer-app/users",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(req.file.buffer);
      });

      profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // ==========================================
    // Create Lawyer
    // ==========================================

    const lawyer = new UserModel({
      name,
      email,
      password,
      phone,
      role: "lawyer",
      officeId: office._id,
      profileImage,
    });

    await lawyer.save();

    // ==========================================
    // Response
    // ==========================================

    return res.status(201).json({
      message: "تم إنشاء المحامي بنجاح",
      lawyer,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Lawyers
// ==========================================

const getLawyers = async (req, res, next) => {
  try {
    const lawyers = await UserModel.find({
      role: "lawyer",
    }).populate("officeId", "name");

    return res.status(200).json({
      lawyers,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Lawyer
// ==========================================

const deleteLawyer = async (req, res, next) => {
  const { id } = req.params;

  try {
    // ==========================================
    // Find Lawyer
    // ==========================================

    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    });

    if (!lawyer) {
      throw new AppError("المحامي غير موجود", 404);
    }

    // ==========================================
    // Find Office
    // ==========================================

    const office = await OfficeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    // ==========================================
    // Check Lawyer Belongs To Office
    // ==========================================

    if (
      !lawyer.officeId ||
      lawyer.officeId.toString() !== office._id.toString()
    ) {
      throw new AppError("ليس لديك صلاحية حذف هذا المحامي", 403);
    }

    // ==========================================
    // Delete Lawyer
    // ==========================================

    await UserModel.findByIdAndDelete(id);

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم حذف المحامي بنجاح",
      lawyer,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Lawyer By ID
// ==========================================

const getLawyerById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    }).populate("officeId", "name");

    if (!lawyer) {
      throw new AppError("المحامي غير موجود", 404);
    }

    return res.status(200).json({
      lawyer,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Lawyer
// ==========================================

const updateLawyer = async (req, res, next) => {
  const { id } = req.params;

  const { name, email, password, phone } = req.body;

  try {
    // ==========================================
    // Find Lawyer
    // ==========================================

    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    }).select("+password");

    if (!lawyer) {
      throw new AppError("المحامي غير موجود", 404);
    }

    // ==========================================
    // Find Office
    // ==========================================

    const office = await OfficeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    // ==========================================
    // Check Lawyer Belongs To Office
    // ==========================================

    if (
      !lawyer.officeId ||
      lawyer.officeId.toString() !== office._id.toString()
    ) {
      throw new AppError("ليس لديك صلاحية تعديل هذا المحامي", 403);
    }

    // ==========================================
    // Update Basic Data
    // ==========================================

    lawyer.name = name ?? lawyer.name;

    lawyer.email = email ?? lawyer.email;

    lawyer.phone = phone ?? lawyer.phone;

    // ==========================================
    // Update Password
    // ==========================================

    if (password) {
      lawyer.password = password;
    }

    // ==========================================
    // Update Profile Image
    // ==========================================

    if (req.file) {
      // Old Public ID
      const oldPublicId = lawyer.profileImage?.publicId;

      // Upload New Image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "lawyer-app/users",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(req.file.buffer);
      });

      // Save New Image
      lawyer.profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      // Delete Old Image
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
        });
      }
    }

    // ==========================================
    // Save Changes
    // ==========================================

    await lawyer.save();

    // ==========================================
    // Remove Password From Response
    // ==========================================

    const lawyerResponse = lawyer.toObject();

    delete lawyerResponse.password;

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم تحديث المحامي بنجاح",
      lawyer: lawyerResponse,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Export
// ==========================================

export { createLawyer, getLawyers, deleteLawyer, updateLawyer, getLawyerById };
