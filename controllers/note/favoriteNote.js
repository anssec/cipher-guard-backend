const secureNotes = require("../../models/secureNotes.js");
const User = require("../../models/user.js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");
exports.favoriteNote = async (req, res) => {
  try {
    const { favorite } = req.body;
    const id = req.params.id;
    // BOLA check: verify the note belongs to this user
    const user = await User.findById(req.user.id);
    if (!user.secureNotes.some((noteId) => noteId.toString() === id)) {
      Response(res, false, "Not authorized to update this note", 403);
      return;
    }
    const updateNotes = {};
    if (favorite === true || favorite === false) {
      updateNotes.favorite = favorite;
    }
    try {
      await secureNotes.findByIdAndUpdate(id, updateNotes, {
        new: true,
      });
      Response(res, true, "Note updated successfully", 200);
      nodeCache.del(`getAllNote_${req.user.id}`);
      nodeCache.del(`favoriteNotes_${req.user.id}`);
      return;
    } catch (error) {
      Response(res, false, "Note not found", 404);
      return;
    }
  } catch (error) {
    console.log(error.message);
    Response(res, false, "Internal server error Try Again", 500);
    return;
  }
};
