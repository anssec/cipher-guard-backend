const passwordvault = require("../../models/passwordVault.js");
const User = require("../../models/user.js");
const nodeCache = require("../../utils/nodeCache.js");
const Response = require("../../utils/Response.js");

exports.deleteSavedPasswd = async (req, res) => {
  try {
    const verifyToken = req.user;
    const id = req.params.id;
    try {
      await passwordvault.findByIdAndDelete(id);
      await User.findByIdAndUpdate(verifyToken.id, {
        $pull: { passwordVault: id },
      });
      nodeCache.del("getSavedPasswd");
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
