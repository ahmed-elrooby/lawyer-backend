import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import AppError from "./AppError.js";



const getCaseTypeOwner = async (userId) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError("المستخدم غير موجود", 404);
  }

  // Office Owner
  if (user.role === "office_owner") {
    if (!user.officeId) {
      throw new AppError("المستخدم غير مرتبط بمكتب", 400);
    }

    const office = await officeModel.findById(user.officeId);

    if (!office) {
      throw new AppError("المكتب غير موجود", 404);
    }

    return {
      ownerType: "office",
      officeId: user.officeId,
      lawyerId: null,
      user,
    };
  }

  // Lawyer
  if (user.role === "lawyer") {
    // Lawyer داخل مكتب
    if (user.officeId) {
      const office = await officeModel.findById(user.officeId);

      if (!office) {
        throw new AppError("المكتب غير موجود", 404);
      }

      return {
        ownerType: "office",
        officeId: user.officeId,
        lawyerId: null,
        user,
      };
    }

    // Lawyer مستقل
    return {
      ownerType: "lawyer",
      officeId: null,
      lawyerId: user._id,
      user,
    };
  }

  throw new AppError("ليس لديك صلاحية لإدارة أنواع القضايا", 403);
};

export default getCaseTypeOwner;
