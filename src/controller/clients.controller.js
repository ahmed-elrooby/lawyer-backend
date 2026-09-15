import ClientModel from "../models/clients.model.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";

/**
 * تحديد صلاحية الوصول للعملاء حسب المستخدم
 *
 * office_owner
 * -> كل عملاء مكتبه
 *
 * lawyer داخل مكتب
 * -> كل عملاء مكتبه
 *
 * lawyer مستقل
 * -> العملاء الذين أنشأهم هو فقط
 */
const getClientAccessFilter = async (req) => {
  // صاحب المكتب
  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    return {
      officeId: office._id,
    };
  }

  // المحامي
  if (req.user.role === "lawyer") {
    const lawyer = await UserModel.findById(req.user.id).select("officeId");

    if (!lawyer) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    // المحامي تابع لمكتب
    if (lawyer.officeId) {
      return {
        officeId: lawyer.officeId,
      };
    }

    // المحامي مستقل
    return {
      createdBy: req.user.id,
      officeId: null,
    };
  }

  throw new AppError("غير مصرح لك بالوصول إلى العملاء", 403);
};

/**
 * إنشاء عميل
 */
const createClient = async (req, res, next) => {
  const {
    name,
    phone,
    email,
    address,
    city,
    country,
    nationalId,
    notes,
  } = req.body;

  try {
    let officeId = null;

    // Office Owner
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // Lawyer
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id).select(
        "officeId",
      );

      if (!lawyer) {
        throw new AppError("المستخدم غير موجود", 404);
      }

      // لو تابع لمكتب هيتخزن المكتب
      // لو مستقل هتفضل null
      officeId = lawyer.officeId || null;
    }

    // التأكد إن الدور مسموح
    if (!["office_owner", "lawyer"].includes(req.user.role)) {
      throw new AppError(
        "غير مصرح لك بإنشاء عميل",
        403,
      );
    }

    // صورة العميل
    let profileImage = {
      url: null,
      publicId: null,
    };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "lawyer-app/clients",
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

    const client = new ClientModel({
      name,
      phone,
      email,
      address,
      city,
      country,
      nationalId,
      notes,

      // Backend هو المسؤول عن تحديد المكتب
      officeId,

      // صاحب العميل
      createdBy: req.user.id,

      // صورة العميل
      profileImage,
    });

    await client.save();

    res.status(201).json({
      message: "تم إنشاء العميل بنجاح",
      client,
    });
  } catch (e) {
    console.error("Create Client Error:", e);

    if (e.code === 11000) {
      return res.status(409).json({
        message: "الرقم القومي مسجل بالفعل",
      });
    }

    next(e);
  }
};

/**
 * جلب كل العملاء
 */
const getAllClients = async (req, res, next) => {
  try {
    const filter = await getClientAccessFilter(req);

    const clients = await ClientModel.find(filter)
      .populate("officeId", "name")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      clients,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * جلب عميل واحد
 */
const getClientById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const accessFilter = await getClientAccessFilter(req);

    const client = await ClientModel.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("officeId", "name")
      .populate("createdBy", "name role");

    if (!client) {
      throw new AppError("العميل غير موجود", 404);
    }

    res.status(200).json({
      client,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * تحديث عميل
 */
const updateClient = async (req, res, next) => {
  const { id } = req.params;

  const {
    name,
    phone,
    email,
    address,
    city,
    country,
    nationalId,
    notes,
  } = req.body;

  try {
    const accessFilter = await getClientAccessFilter(req);

    const client = await ClientModel.findOneAndUpdate(
      {
        _id: id,
        ...accessFilter,
      },
      {
        name,
        phone,
        email,
        address,
        city,
        country,
        nationalId,
        notes,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("officeId", "name")
      .populate("createdBy", "name role");

    if (!client) {
      throw new AppError("العميل غير موجود", 404);
    }

    res.status(200).json({
      message: "تم تحديث العميل بنجاح",
      client,
    });
  } catch (e) {
    console.error("Update Client Error:", e);

    if (e.code === 11000) {
      return res.status(409).json({
        message: "الرقم القومي مسجل بالفعل",
      });
    }

    next(e);
  }
};

/**
 * حذف عميل
 */
const deleteClient = async (req, res, next) => {
  const { id } = req.params;

  try {
    const accessFilter = await getClientAccessFilter(req);

    const client = await ClientModel.findOneAndDelete({
      _id: id,
      ...accessFilter,
    });

    if (!client) {
      throw new AppError("العميل غير موجود", 404);
    }

    res.status(200).json({
      message: "تم حذف العميل بنجاح",
    });
  } catch (e) {
    next(e);
  }
};

export {
  createClient,
  getAllClients,
  deleteClient,
  getClientById,
  updateClient,
};