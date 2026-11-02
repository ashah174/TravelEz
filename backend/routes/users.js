const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const PROFILE_FIELDS = ["name", "image", "preferences"];

function toProfile(user) {
  return {
    name: user?.name || "",
    image: user?.image || "",
    preferences: user?.preferences || "",
    exists: !!user,
  };
}

// GET the current user's profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json(toProfile(user));
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({ message: "Error getting profile" });
  }
});

// UPDATE (or create) the current user's profile
router.put("/me", requireAuth, async (req, res) => {
  try {
    const update = {};
    PROFILE_FIELDS.forEach((field) => {
      if (typeof req.body[field] === "string") {
        update[field] = req.body[field];
      }
    });

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: update },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(toProfile(user));
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({ message: "Error updating profile" });
  }
});

module.exports = router;
