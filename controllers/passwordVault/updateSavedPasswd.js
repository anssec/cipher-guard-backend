const passwordvault = require("../../models/passwordVault.js");
const nodeCache = require("../../utils/nodeCache.js");
const Response = require("../../utils/Response.js");
const CryptoJS = require("crypto-js");

exports.updateSavedPasswd = async (req, res) => {
  try {
    const vaultPin = req.vaultPin;
    const id = req.params.id;
    const { name, username, password, website } = req.body;
    const currentDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    const updateData = {
      Updated: currentDate,
    };

    if (name) {
      updateData.name = name;
    }
    if (username) {
      updateData.username = username;
    }
    if (password) {
      updateData.password = await CryptoJS.AES.encrypt(
        password,
        vaultPin
      ).toString();
      updateData.passwordUpdated = currentDate;
    }
    if (website) {
      updateData.website = website;
    }

    try {
      const updatedPassword = await passwordvault.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      if (!updatedPassword) {
        Response(res, true, "Password not found", 404);
        return;
      }
      updatedPassword.passwordHistory += 1;
      await updatedPassword.save();
      nodeCache.del("getSavedPasswd");
      Response(res, true, "Password Updated", 200);
      return;
    } catch (error) {
      console.log(error.message);
      Response(res, true, "Unable to update password", 404);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
