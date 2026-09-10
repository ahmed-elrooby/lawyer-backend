import cloudinary from "../config/cloudinary.js";
import UserModel from "../models/User.model.js";
import officeModel from "../models/office.model.js";
import OfficeModel from "../models/office.model.js";

const createLawyer = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const office = await OfficeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return res.status(404).json({
        message: "لم يتم العثور على المكتب",
      });
    }

    let profileImage = {
      url: null,
      publicId: null,
    };

    // رفع صورة المحامي
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

    res.status(201).json({
      message: "تم إنشاء المحامي بنجاح",
      lawyer,
    });
  } catch (e) {
    console.error("Create Lawyer Error:", e);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

const getLawyers = async (req, res) => {
  try {
    const lawyers = await UserModel.find({ role: "lawyer" }).populate(
      "officeId",
      "name",
    );

    res.status(200).json({
      lawyers,
    });
  } catch (error) {
    console.error("Get Lawyers Error:", error);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const deleteLawyer = async (req, res) => {
  const { id } = req.params;

  try {
    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    });

    if (!lawyer) {
      return res.status(404).json({
        message: "المحامي غير موجود",
      });
    }

    const office = await OfficeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return res.status(404).json({
        message: "لم يتم العثور على المكتب",
      });
    }

    if (
      !lawyer.officeId ||
      lawyer.officeId.toString() !== office._id.toString()
    ) {
      return res.status(403).json({
        message: "ليس لديك صلاحية حذف هذا المحامي",
      });
    }

    await UserModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "تم حذف المحامي بنجاح",
      lawyer,
    });
  } catch (e) {
    console.error("Delete Lawyer Error:", e);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const getLawyerById = async (req, res) => {
  const { id } = req.params;

  try {
    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    }).populate("officeId", "name");

    if (!lawyer) {
      return res.status(404).json({
        message: "المحامي غير موجود",
      });
    }

    res.status(200).json({
      lawyer,
    });
  } catch (e) {
    console.error("Get Lawyer By Id Error:", e);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const updateLawyer = async (req, res) => {
  const { id } = req.params;

  const { name, email, password, phone } = req.body;

  try {
    // 1️⃣ البحث عن المحامي
    const lawyer = await UserModel.findOne({
      _id: id,
      role: "lawyer",
    }).select("+password");

    if (!lawyer) {
      return res.status(404).json({
        message: "المحامي غير موجود",
      });
    }

    // 2️⃣ البحث عن مكتب صاحب الطلب
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return res.status(404).json({
        message: "لم يتم العثور على المكتب",
      });
    }

    // 3️⃣ التأكد أن المحامي تابع لمكتب صاحب الطلب
    if (
      !lawyer.officeId ||
      lawyer.officeId.toString() !== office._id.toString()
    ) {
      return res.status(403).json({
        message: "ليس لديك صلاحية تعديل هذا المحامي",
      });
    }

    // 4️⃣ تعديل البيانات الأساسية
    lawyer.name = name ?? lawyer.name;
    lawyer.email = email ?? lawyer.email;
    lawyer.phone = phone ?? lawyer.phone;

    // 5️⃣ تعديل الباسورد
    // لو password اتبعت، الـ pre("save") في User Model
    // هيعمل لها bcrypt hash تلقائيًا
    if (password) {
      lawyer.password = password;
    }

    // 6️⃣ لو فيه صورة جديدة
    if (req.file) {
      // نحفظ publicId للصورة القديمة
      const oldPublicId = lawyer.profileImage?.publicId;

      // رفع الصورة الجديدة إلى Cloudinary
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

      // حفظ بيانات الصورة الجديدة في MongoDB
      lawyer.profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      // حذف الصورة القديمة من Cloudinary
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }
    }

    // 7️⃣ حفظ التعديلات
    await lawyer.save();

    // 8️⃣ منع إرسال password للـ Frontend
    const lawyerResponse = lawyer.toObject();
    delete lawyerResponse.password;

    // 9️⃣ Response
    res.status(200).json({
      message: "تم تحديث المحامي بنجاح",
      lawyer: lawyerResponse,
    });
  } catch (e) {
    console.error("Update Lawyer Error:", e);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

export { createLawyer, getLawyers, deleteLawyer, updateLawyer, getLawyerById };
