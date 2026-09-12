import cloudinary from "../config/cloudinary.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import AppError from "../utils/AppError.js";

const createUser = async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  try {
    if (req.user.role === "office_owner" && role !== "lawyer") {
      throw new AppError("صاحب المكتب يستطيع إضافة محامين فقط", 403);
    }

    let office = null;

    if (req.user.role === "office_owner") {
      office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }
    }

    let profileImage = {
      url: null,
      publicId: null,
    };

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

      profileImage.url = result.secure_url;
      profileImage.publicId = result.public_id;
    }

    const user = new UserModel({
      name,
      email,
      password,
      phone,
      role,
      officeId: office ? office._id : null,
      profileImage,
    });

    await user.save();

    return res.status(201).json({
      message: "تم إنشاء المستخدم بنجاح",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find({});
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    if (req.user.role === "office_owner" && user.role !== "lawyer") {
      throw new AppError("صاحب المكتب يستطيع حذف المحامين فقط", 403);
    }

    await UserModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "تم حذف المستخدم بنجاح",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  try {
    // 1️⃣ نجيب المستخدم الأول
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    // 2️⃣ التحقق من صلاحيات صاحب المكتب
    if (req.user.role === "office_owner") {
      if (user.role !== "lawyer") {
        throw new AppError("صاحب المكتب يستطيع تعديل المحامين فقط", 403);
      }

      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      if (
        !user.officeId ||
        user.officeId.toString() !== office._id.toString()
      ) {
        throw new AppError("ليس لديك صلاحية تعديل هذا المحامي", 403);
      }
    }

    // 3️⃣ تعديل البيانات العادية
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;

    // 4️⃣ لو فيه صورة جديدة
    if (req.file) {
      const oldPublicId = user.profileImage?.publicId;

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

      // الصورة الجديدة
      user.profileImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      // 5️⃣ حذف الصورة القديمة
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }
    }

    // 6️⃣ حفظ التعديلات
    await user.save();

    return res.status(200).json({
      message: "تم تحديث المستخدم بنجاح",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export { createUser, getUsers, getUserById, deleteUser, updateUser };
