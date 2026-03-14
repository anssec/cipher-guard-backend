const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
  },
  isEmailVerify: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    trim: true,
    select: false,
  },
  profileImg: {
    type: String,
    trim: true,
  },
  wrongPasswdAttempt: {
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptTime: {
      type: Date,
      default: Date.now(),
    },
  },
  accountLock: {
    type: Boolean,
    default: false,
  },
  vaultPin: {
    type: String,
  },
  vaultAuth: {
    type: String,
  },
  passwordVault: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "passwordVault",
    },
  ],
  secureNotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "securenotes",
    },
  ],
  role: {
    type: String,
    default: "user",
  },
  emergencyMail: {
    type: String,
    trim: true,
  },
  emergencyAccessPasswd: {
    type: String,
  },
});

// mongoose.models = {};
module.exports = mongoose.model("user", userSchema);
