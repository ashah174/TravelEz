const mongoose = require("mongoose");

// One document per "follower follows followee" relationship (Firebase UIDs).
const followSchema = new mongoose.Schema(
  {
    follower: { type: String, required: true },
    followee: { type: String, required: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, followee: 1 }, { unique: true });
followSchema.index({ followee: 1 });

module.exports = mongoose.model("Follow", followSchema);
