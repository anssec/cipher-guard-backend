const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.searchNote = async (req, res) => {
  try {
    const verifyToken = req.user;
    const name = req.query.name;
    if (!name) {
      Response(res, false, "Search query is required", 422);
      return;
    }
    const user = await User.findById(verifyToken.id).populate("secureNotes");
    const escapedName = escapeRegExp(name);
    const searchResult = user.secureNotes.filter((note) =>
      new RegExp(escapedName, "i").test(note.name)
    );
    Response(
      res,
      true,
      null,
      200,
      searchResult.length > 0 ? searchResult : "No result found"
    );
    return;
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
