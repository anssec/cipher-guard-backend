const User = require("../../models/user.js");
const nodeCache = require("../../utils/nodeCache.js");
const Response = require("../../utils/Response.js");

exports.getFavoriteNote = async (req, res) => {
  try {
    const verifyToken = req.user;
    let favoriteNotes;
    if (nodeCache.has("favoriteNotes")) {
      favoriteNotes = JSON.parse(nodeCache.get("favoriteNotes"));
      Response(res, true, null, 200, favoriteNotes);
      return;
    } else {
      const user = await User.findById(verifyToken.id).populate("secureNotes");
      favoriteNotes = user.secureNotes.filter((note) => note.favorite);
      nodeCache.set("favoriteNotes", JSON.stringify(favoriteNotes), 300);
      Response(res, true, null, 200, favoriteNotes);
      return;
    }
    Response(res, true, null, 200, favoriteNotes);
    return;
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
