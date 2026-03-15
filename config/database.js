const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

exports.connectDB = async () => {
  if (isConnected) {
    console.log("Using existing DB connection");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("DB Connected Successfully");
  } catch (error) {
    console.log("DB Connection Failed");
    console.error(error);
    throw error;
  }
};
