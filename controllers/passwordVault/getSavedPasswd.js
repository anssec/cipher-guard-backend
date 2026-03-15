const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");

exports.getSavedPasswd = async (req, res) => {
  try {
    const verifyToken = req.user;
    let getAllSavedPasswd;
    // console.log("nodeCache:", nodeCache);
    // console.log("verifyToken:", verifyToken);

    const userId = verifyToken.id;
    if (nodeCache.has(`getSavedPasswd_${userId}`)) {
      getAllSavedPasswd = JSON.parse(nodeCache.get(`getSavedPasswd_${userId}`));
    } else {
      const user = await User.findById(verifyToken.id).populate(
        "passwordVault"
      );
      getAllSavedPasswd = user.passwordVault;
      nodeCache.set(`getSavedPasswd_${userId}`, JSON.stringify(getAllSavedPasswd), 300);
    }
    Response(res, true, null, 200, getAllSavedPasswd);
    return;
  } catch (error) {
    console.error(error);
    Response(res, false, "Internal server error. Try again.", 500);
    return;
  }
};
