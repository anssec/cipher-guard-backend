const mongoose = require("mongoose");
require("dotenv").config();

exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.log("DB Connection Failed");
    console.error(error);
    process.exit(1);
  }
};
