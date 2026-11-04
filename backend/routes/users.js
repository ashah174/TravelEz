const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Itinerary = require("../models/Itinerary");
const Follow = require("../models/Follow");
const { requireAuth, optionalAuth } = require("../middleware/auth");
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

function toCard(user) {
  return { uid: user.uid, name: user.name || "", image: user.image || "" };
}

// GET the people the current user follows
router.get("/me/following", requireAuth, async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user.uid }).sort({ createdAt: -1 });
    const uids = follows.map((follow) => follow.followee);
    const users = await User.find({ uid: { $in: uids } }, "uid name image").lean();
    const byUid = new Map(users.map((user) => [user.uid, user]));

    res.json(uids.map((uid) => toCard(byUid.get(uid) || { uid })));
  } catch (error) {
    console.error("Error getting following list:", error);
    res.status(500).json({ message: "Error getting following list" });
  }
});

// FOLLOW a user
router.post("/:uid/follow", requireAuth, async (req, res) => {
  try {
    const followee = req.params.uid;

    if (followee === req.user.uid) {
      return res.status(400).json({ message: "You can't follow yourself." });
    }

    const exists =
      (await User.exists({ uid: followee })) ||
      (await Itinerary.exists({ ownerUid: followee, isPublic: true }));
    if (!exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await Follow.updateOne(
      { follower: req.user.uid, followee },
      { $setOnInsert: { follower: req.user.uid, followee } },
      { upsert: true }
    );

    res.json({
      following: true,
      followerCount: await Follow.countDocuments({ followee }),
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "Error following user" });
  }
});

// UNFOLLOW a user
router.delete("/:uid/follow", requireAuth, async (req, res) => {
  try {
    const followee = req.params.uid;
    await Follow.deleteOne({ follower: req.user.uid, followee });

    res.json({
      following: false,
      followerCount: await Follow.countDocuments({ followee }),
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Error unfollowing user" });
  }
});

// GET a user's public profile and their public itineraries
router.get("/:uid", optionalAuth, async (req, res) => {
  try {
    const uid = req.params.uid;
    const [user, itineraries, followerCount, followingCount, isFollowing] =
      await Promise.all([
        User.findOne({ uid }),
        Itinerary.find({ ownerUid: uid, isPublic: true }).sort({ createdAt: -1 }),
        Follow.countDocuments({ followee: uid }),
        Follow.countDocuments({ follower: uid }),
        req.user ? Follow.exists({ follower: req.user.uid, followee: uid }) : null,
      ]);

    if (!user && itineraries.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const ratings = itineraries.flatMap((trip) =>
      trip.comments.map((comment) => Number(comment.rating) || 0)
    );

    res.json({
      profile: toProfile(user || { uid }),
      isFollowing: !!isFollowing,
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
        copyCount: itineraries.reduce((sum, trip) => sum + (trip.copyCount || 0), 0),
        followerCount,
        followingCount,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Error getting user profile" });
  }
});

module.exports = router;
