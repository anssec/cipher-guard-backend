const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");

exports.getLockUser = async (req, res) => {
  try {
    let lockUser;
    if (nodeCache.has("getLockUser")) {
      lockUser = JSON.parse(nodeCache.get("getLockUser"));
      Response(res, true, null, 200, lockUser);
      return;
    } else {
      lockUser = await User.find({ accountLock: true });
      nodeCache.set(
        "getLockUser",
        JSON.stringify(lockUser),
        200
      );
      Response(res, true, null, 200, lockUser);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
