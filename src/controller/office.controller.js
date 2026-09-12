import officeModel from "../models/office.model.js";
import AppError from "../utils/AppError.js";

// ==========================================
// Create Office
// ==========================================

const CreateOffice = async (req, res, next) => {
  const { name, phone, email, address, city, country } = req.body;

  try {
    const office = new officeModel({
      name,
      phone,
      email,
      address,
      city,
      country,
      Owner_id: req.user.id,
    });

    await office.save();

    return res.status(201).json({
      message: "تم إنشاء المكتب بنجاح",
      office,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get All Offices
// ==========================================

const getOffice = async (req, res, next) => {
  try {
    const office = await officeModel.find({}).populate("Owner_id", "name id");

    return res.status(200).json({
      office,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Office By ID
// ==========================================

const getOfficeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const office = await officeModel
      .findById(id)
      .populate("Owner_id", "name id");

    if (!office) {
      throw new AppError("المكتب غير موجود", 404);
    }

    return res.status(200).json({
      office,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Office
// ==========================================

const deleteOffice = async (req, res, next) => {
  const { id } = req.params;

  try {
    const office = await officeModel.findByIdAndDelete(id);

    if (!office) {
      throw new AppError("المكتب غير موجود", 404);
    }

    return res.status(200).json({
      message: "تم حذف المكتب بنجاح",
      office,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Office
// ==========================================

const updateOffice = async (req, res, next) => {
  const { id } = req.params;

  const { name, phone, email, address, city, country } = req.body;

  try {
    const office = await officeModel.findById(id);

    if (!office) {
      throw new AppError("المكتب غير موجود", 404);
    }

    // ==========================================
    // Office Owner Permission
    // ==========================================

    if (
      req.user.role === "office_owner" &&
      office.Owner_id.toString() !== req.user.id
    ) {
      throw new AppError("ليس لديك صلاحية تعديل هذا المكتب", 403);
    }

    // ==========================================
    // Update Fields
    // ==========================================

    office.name = name ?? office.name;

    office.phone = phone ?? office.phone;

    office.email = email ?? office.email;

    office.address = address ?? office.address;

    office.city = city ?? office.city;

    office.country = country ?? office.country;

    await office.save();

    return res.status(200).json({
      message: "تم تحديث المكتب بنجاح",
      office,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Export
// ==========================================

export { CreateOffice, getOffice, getOfficeById, deleteOffice, updateOffice };
