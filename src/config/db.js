import dns from "dns";
import mongoose from "mongoose";

// حل مشكلة DNS الخاصة بـ MongoDB Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectedDb = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);

    console.log("Database connected");
  } catch (error) {
    console.log("Database connection error:", error);
  }
};

export default connectedDb;
