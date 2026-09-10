import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
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

export { login };
