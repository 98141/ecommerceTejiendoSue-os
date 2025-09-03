require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const {
  MONGO_URI = "mongodb://localhost:27017/pajatoquilla",
  ADMIN_EMAIL = "admin@example.com",
  ADMIN_NAME = "Admin",
  ADMIN_PASSWORD = "Cambiar123!",
} = process.env;

async function run() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  let user = await User.findOne({ email: ADMIN_EMAIL }).select("+password");
  if (!user) {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
      isVerified: true,
    });
    console.log("✅ Admin creado:", user.email);
  } else {
    user.name = ADMIN_NAME;
    user.role = "admin";
    user.isVerified = true;
    if (ADMIN_PASSWORD) {
      user.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    }
    await user.save();
    console.log("✅ Admin actualizado:", user.email);
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ Error creando admin:", e);
  process.exit(1);
});
