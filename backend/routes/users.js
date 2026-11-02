const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Itinerary = require("../models/Itinerary");
const { requireAuth } = require("../middleware/auth");
const { presentItineraries } = require("../utils/present");

const PROFILE_FIELDS = ["name", "image", "preferences"];

function toProfile(user) {
  return {
    uid: user?.uid || null,
    name: user?.name || "",
    image: user?.image || "",
    preferences: user?.preferences || "",
  };
}

// CREATE the current user's profile on sign-in if it doesn't exist yet,
// seeded from their Google name and photo. Never overwrites existing values.
router.post("/me/sync", requireAuth, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $setOnInsert: {
          uid: req.user.uid,
          name: req.user.name || "",
          image: req.user.picture || "",
        },
      },
      { returnDocument: "after", upsert: true }
    );

    res.json(toProfile(user));
  } catch (error) {
    console.error("Error syncing profile:", error);
    res.status(500).json({ message: "Error syncing profile" });
  }
});

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

// GET a user's public profile and their public itineraries
router.get("/:uid", async (req, res) => {
  try {
    const [user, itineraries] = await Promise.all([
      User.findOne({ uid: req.params.uid }),
      Itinerary.find({ ownerUid: req.params.uid, isPublic: true }).sort({
        createdAt: -1,
      }),
    ]);

    if (!user && itineraries.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const ratings = itineraries.flatMap((trip) =>
      trip.comments.map((comment) => Number(comment.rating) || 0)
    );

    res.json({
      profile: toProfile(user || { uid: req.params.uid }),
      itineraries: await presentItineraries(itineraries),
      stats: {
        tripCount: itineraries.length,
        reviewCount: ratings.length,
        averageRating: ratings.length
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
        favoriteCount: itineraries.reduce(
          (sum, trip) => sum + trip.favoritedBy.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Error getting user profile" });
  }
});

module.exports = router;
