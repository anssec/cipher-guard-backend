const passwordvault = require("../../models/passwordVault.js");
const User = require("../../models/user.js");
const nodeCache = require("../../utils/nodeCache.js");
const Response = require("../../utils/Response.js");

exports.deleteSavedPasswd = async (req, res) => {
  try {
    const verifyToken = req.user;
    const id = req.params.id;
    // BOLA check: verify the password entry belongs to this user
    const user = await User.findById(verifyToken.id);
    if (!user.passwordVault.some((pwId) => pwId.toString() === id)) {
      Response(res, false, "Not authorized to delete this password", 403);
      return;
    }
    try {
      await passwordvault.findByIdAndDelete(id);
      await User.findByIdAndUpdate(verifyToken.id, {
        $pull: { passwordVault: id },
      });
      nodeCache.del(`getSavedPasswd_${verifyToken.id}`);
      Response(res, true, "Password delete successfully", 200);
      return;
    } catch (error) {
      console.log(error.message);
      Response(res, false, "Unable to delete item", 404);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
