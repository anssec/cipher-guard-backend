const User = require("../../models/user.js");
const secureNotes = require("../../models/secureNotes.js");
const Response = require("../../utils/Response.js");
const nodeCache = require("../../utils/nodeCache.js");
exports.deleteNote = async (req, res) => {
  try {
    const verifyUser = req.user;
    const notesId = req.params.id;
    // BOLA check: verify the note belongs to this user
    const user = await User.findById(verifyUser.id);
    if (!user.secureNotes.some((noteId) => noteId.toString() === notesId)) {
      Response(res, false, "Not authorized to delete this note", 403);
      return;
    }
    try {
      await secureNotes.findByIdAndDelete(notesId);
      await User.updateOne(
        { _id: verifyUser.id },
        {
          $pull: { secureNotes: notesId },
        },
        { new: true }
      );
      nodeCache.del(`getAllNote_${verifyUser.id}`);
      nodeCache.del(`favoriteNotes_${verifyUser.id}`);
      Response(res, true, "note delete successfully", 200);
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
