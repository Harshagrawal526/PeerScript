import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true, // already builds the index; a separate index: true duplicates it
    },
    name: {
      type: String,
      default: "Untitled Project",
      trim: true,
      maxlength: 50,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous rooms for now
    },
    code: {
      html: {
        type: String,
        default: "",
      },
      css: {
        type: String,
        default: "",
      },
      js: {
        type: String,
        default: "",
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Room", RoomSchema);
