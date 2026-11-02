const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    image: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    preferences: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
