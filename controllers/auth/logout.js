const Response = require("../../utils/Response.js");
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    Response(res, true, "Logged out successfully", 200);
    return;
  } catch (error) {
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
