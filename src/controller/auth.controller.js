import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
// get user email find if exist or not
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "الايميل وكلمة المرور مطلوبة" });
    }
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "المستخدم غير موجود" });
    }
    if (!user.isActive) {
      return res.status(400).json({ message: "المستخدم غير مفعل" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "كلمة المرور غير صحيحة" });
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
    console.log(error);
    res.status(500).json({ message: "حدث خطاء في السيرفر", error });
  }
};
const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "المستخدم غير موجود",
      });
    }

    res.status(200).json({
      message: "تم جلب بيانات المستخدم بنجاح",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
};
const logout = async (req, res) => {
  try {
    res.status(200).json({
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "الإيميل مطلوب",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "لا يوجد مستخدم بهذا الإيميل",
      });
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
    console.log(error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "التوكن مطلوب",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "كلمة المرور الجديدة مطلوبة",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      });
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "الرابط غير صالح أو منتهي الصلاحية",
      });
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
    console.log(error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
};
export { login, getProfile, logout, forgotPassword, resetPassword };
