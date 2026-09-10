import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    // اسم العميل
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // البريد الإلكتروني
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // رقم الهاتف
    phone: {
      type: String,
      trim: true,
    },

    // العنوان
    address: {
      type: String,
      trim: true,
    },

    // المدينة
    city: {
      type: String,
      trim: true,
    },

    // الدولة
    country: {
      type: String,
      default: "Egypt",
      trim: true,
    },

    // الرقم القومي
    nationalId: {
      type: String,
      trim: true,
    },

    // ملاحظات عن العميل
    notes: {
      type: String,
      trim: true,
    },

    // المكتب الذي ينتمي إليه العميل
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    // المستخدم الذي قام بإنشاء العميل
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // حالة العميل
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// الرقم القومي يكون Unique داخل نفس المكتب فقط
clientSchema.index(
  {
    officeId: 1,
    nationalId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      nationalId: {
        $exists: true,
        $ne: "",
      },
    },
  },
);

const ClientModel = mongoose.model("Client", clientSchema);

export default ClientModel;
