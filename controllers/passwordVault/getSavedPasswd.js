const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");

exports.getSavedPasswd = async (req, res) => {
  try {
    const verifyToken = req.user;
    let getAllSavedPasswd;
    // console.log("nodeCache:", nodeCache);
    // console.log("verifyToken:", verifyToken);

    if (nodeCache.has("getSavedPasswd")) {
      getAllSavedPasswd = JSON.parse(nodeCache.get("getSavedPasswd"));
    } else {
      const user = await User.findById(verifyToken.id).populate(
        "passwordVault"
      );
      getAllSavedPasswd = user.passwordVault;
      nodeCache.set("getSavedPasswd", JSON.stringify(getAllSavedPasswd), 300);
    }
    Response(res, true, null, 200, getAllSavedPasswd);
    return;
  } catch (error) {
    console.error(error);
    Response(res, false, "Internal server error. Try again.", 500);
    return;
  }
};
