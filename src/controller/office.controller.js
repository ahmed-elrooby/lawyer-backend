import officeModel from "./../models/office.model.js";

const CreateOffice = async (req, res) => {
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
    res.status(201).json({ message: "تم إنشاء المكتب بنجاح", office });
  } catch (e) {
    res.status(500).send(e);
  }
};
const getOffice = async (req, res) => {
  try {
    const office = await officeModel.find({}).populate("Owner_id", "name id");
    res.status(200).json({ office });
  } catch (e) {
    res.status(500).send(e);
  }
};
const getOfficeById = async (req, res) => {
  const { id } = req.params;
  try {
    const office = await officeModel
      .findById(id)
      .populate("Owner_id", "name id");
    if (!office) return res.status(404).json({ message: "المكتب غير موجود" });
    res.status(200).json({ office });
  } catch (e) {
    res.status(500).send(e);
  }
};

const deleteOffice = async (req, res) => {
  const { id } = req.params;
  try {
    const office = await officeModel.findByIdAndDelete(id);
    if (!office) return res.status(404).json({ message: "المكتب غير موجود" });
    res.status(200).json({ message: "تم حذف المكتب بنجاح", office });
  } catch (e) {
    res.status(500).send(e);
  }
};

const updateOffice = async (req, res) => {
  const { id } = req.params;

  const { name, phone, email, address, city, country } = req.body;

  try {
    const office = await officeModel.findById(id);

    if (!office) {
      return res.status(404).json({
        message: "المكتب غير موجود",
      });
    }

    // صاحب المكتب يقدر يعدل مكتبه فقط
    if (
      req.user.role === "office_owner" &&
      office.Owner_id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "ليس لديك صلاحية تعديل هذا المكتب",
      });
    }

    office.name = name ?? office.name;
    office.phone = phone ?? office.phone;
    office.email = email ?? office.email;
    office.address = address ?? office.address;
    office.city = city ?? office.city;
    office.country = country ?? office.country;

    await office.save();

    res.status(200).json({
      message: "تم تحديث المكتب بنجاح",
      office,
    });
  } catch (e) {
    console.error("Update Office Error:", e);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

export { CreateOffice, getOffice, getOfficeById, deleteOffice, updateOffice };
