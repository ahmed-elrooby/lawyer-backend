import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";
// get user email find if exist or not
const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new AppError("الإيميل وكلمة المرور مطلوبة", 400);
    }
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("المستخدم غير موجود", 400);
    }

    if (!user.isActive) {
      throw new AppError("المستخدم غير مفعل", 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("كلمة المرور غير صحيحة", 400);
    }
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );
    user.password = undefined;
    res.status(200).json({ message: "تم تسجيل الدخول بنجاح", token, user });
  } catch (error) {
    next(error);
  }
};
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }
    res.status(200).json({
      message: "تم جلب بيانات المستخدم بنجاح",
      user,
    });
  } catch (error) {
    next(error);
  }
};
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    next(error);
  }
};
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("الإيميل مطلوب", 400);
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new AppError("لا يوجد مستخدم بهذا الإيميل", 404);
    }

    // إنشاء Token عشوائي
    const resetToken = crypto.randomBytes(32).toString("hex");

    // حفظ الـ Token ومدة صلاحيته
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // رابط صفحة تغيير الباسورد في الـ Frontend
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // إرسال الإيميل
    await sendEmail({
      to: user.email,
      subject: "إعادة تعيين كلمة المرور",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8;">
          <h2>إعادة تعيين كلمة المرور</h2>

          <p>مرحبًا ${user.name}،</p>

          <p>
            تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.
          </p>

          <p>
            اضغط على الزر التالي لإنشاء كلمة مرور جديدة:
          </p>

          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            إعادة تعيين كلمة المرور
          </a>

          <p>
            هذا الرابط صالح لمدة <strong>15 دقيقة</strong>.
          </p>

          <p>
            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى الإيميل",
    });
  } catch (error) {
    next(error);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      throw new AppError("التوكن مطلوب", 400);
    }

    if (!password) {
      throw new AppError("كلمة المرور الجديدة مطلوبة", 400);
    }

    if (password.length < 6) {
      throw new AppError("كلمة المرور يجب أن تكون 6 أحرف على الأقل", 400);
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError("الرابط غير صالح أو منتهي الصلاحية", 400);
    }

    // تغيير كلمة المرور
    user.password = password;

    // إلغاء الـ token بعد استخدامه
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { name, phone } = req.body;

  try {

    const user = await UserModel.findById(req.user.id);

    if (!user) {
      throw new AppError("المستخدم غير موجود", 404);
    }

   
    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;


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

      // Save New Image
      user.profileImage = {
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

    await user.save();

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم تحديث البيانات الشخصية بنجاح",
      user,
    });
  } catch (error) {
    next(error);
  }
};


export { login, getProfile, logout, forgotPassword, resetPassword ,updateProfile};
