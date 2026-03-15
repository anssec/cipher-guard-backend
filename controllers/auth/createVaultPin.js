const User = require("../../models/user.js");
const bcrypt = require("bcrypt");
const Response = require("../../utils/Response.js");
exports.createVaultPin = async (req, res) => {
  try {
    const { vaultPin } = req.body;
    const verifyUser = req.user;
    if (vaultPin.toString().length !== 6) {
      Response(res, false, "Enter a 6-digit number", 422);
      return;
    }
    const user = await User.findById(verifyUser.id);
    if (user.vaultPin) {
      Response(res, false, "vault pin already created", 422);
      return;
    }
    const hashVaultPin = await bcrypt.hash(vaultPin.toString(), 12);
    user.vaultPin = hashVaultPin;
    await user.save();
    Response(res, true, "pin created successfully", 200);
    return;
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
