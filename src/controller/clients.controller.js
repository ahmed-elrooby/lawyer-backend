import ClientModel from "../models/clients.model.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import AppError from "../utils/AppError.js";

const createClient = async (req, res) => {
  const { name, phone, email, address, city, country, nationalId, notes } =
    req.body;

  try {
    // 1️⃣ نحدد المكتب حسب المستخدم الحالي
    let office;

    if (req.user.role === "office_owner") {
      office = await officeModel.findOne({
        Owner_id: req.user.id,
      });
    }

    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      office = await officeModel.findById(user.officeId);
    }
    console.log("USER:", req.user);
    console.log("OFFICE:", office);
    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    // 2️⃣ إنشاء العميل
    const client = new ClientModel({
      name,
      phone,
      email,
      address,
      city,
      country,
      nationalId,
      notes,

      // Backend هو اللي بيحددهم
      officeId: office._id,
      createdBy: req.user.id,
    });

    // 3️⃣ حفظ العميل
    await client.save();

    res.status(201).json({
      message: "تم إنشاء العميل بنجاح",
      client,
    });
  } catch (e) {
    console.error("Create Client Error:", e);

    // Duplicate nationalId داخل نفس المكتب
    if (e.code === 11000) {
      return res.status(409).json({
        message: "الرقم القومي مسجل بالفعل في هذا المكتب",
      });
    }

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

const getAllClients = async (req, res, next) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    const clients = await ClientModel.find({
      officeId,
    })
      .populate("officeId", "name")
      .populate("createdBy", "name role");
    res.status(200).json({
      clients,
    });
  } catch (e) {
    next(e);
  }
};
const deleteClient = async (req, res, next) => {
  const { id } = req.params;

  try {
    let officeId;
    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }
    await ClientModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "تم حذف العميل بنجاح",
    });
  } catch (e) {
    next(e);
  }
};

const getClientById = async (req, res, next) => {
  const { id } = req.params;

  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    const client = await ClientModel.findOne({
      _id: id,
      officeId,
    })
      .populate("officeId", "name")
      .populate("createdBy", "name");

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

const updateClient = async (req, res, next) => {
  const { id } = req.params;

  const { name, phone, email, address, city, country, nationalId, notes } =
    req.body;

  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    const client = await ClientModel.findOneAndUpdate(
      {
        _id: id,
        officeId,
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
      .populate("createdBy", "name");

    if (!client) {
      throw new AppError("العميل غير موجود", 404);
    }

    res.status(200).json({
      message: "تم تحديث العميل بنجاح",
      client,
    });
  } catch (e) {
    console.error("Update Client Error:", e);

    // الرقم القومي موجود بالفعل في نفس المكتب
    if (e.code === 11000) {
      return res.status(409).json({
        message: "الرقم القومي مسجل بالفعل في هذا المكتب",
      });
    }

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

export {
  createClient,
  getAllClients,
  deleteClient,
  getClientById,
  updateClient,
};
