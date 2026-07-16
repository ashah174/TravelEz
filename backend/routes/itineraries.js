const express = require("express");
const router = express.Router();
const Itinerary = require("../models/Itinerary");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { isAdminEmail } = require("../config/admins");

const UPDATABLE_FIELDS = [
  "title",
  "destination",
  "duration",
  "cost",
  "image",
  "description",
  "isPublic",
  "days",
];

function applyUpdatableFields(itinerary, body) {
  UPDATABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      itinerary[field] = body[field];
    }
  });
}

// GET all itineraries (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (error) {
    console.error("Error getting itineraries:", error);
    res.status(500).json({ message: "Error getting itineraries" });
  }
});

// GET public itineraries
router.get("/public", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ isPublic: true }).sort({
      createdAt: -1,
    });

    res.json(itineraries);
  } catch (error) {
    console.error("Error fetching public itineraries:", error);
    res.status(500).json({ message: "Error fetching public itineraries" });
  }
});

// GET search results (public itineraries only)
router.get("/search", async (req, res) => {
  try {
    const { destination } = req.query;

    const itineraries = await Itinerary.find({
      isPublic: true,
      destination: { $regex: destination || "", $options: "i" },
    });

    res.json(itineraries);
  } catch (error) {
    console.error("Error searching itineraries:", error);
    res.status(500).json({ message: "Error searching itineraries" });
  }
});

// GET itineraries owned by the current user
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      ownerEmail: req.user.email,
    }).sort({ createdAt: -1 });

    res.json(itineraries);
  } catch (error) {
    console.error("Error getting your itineraries:", error);
    res.status(500).json({ message: "Error getting your itineraries" });
  }
});

// GET itineraries favorited by the current user
router.get("/favorites", requireAuth, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      favoritedBy: req.user.email,
    }).sort({ createdAt: -1 });

    res.json(itineraries);
  } catch (error) {
    console.error("Error getting favorite itineraries:", error);
    res.status(500).json({ message: "Error getting favorite itineraries" });
  }
});

// GET one itinerary
router.get("/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    res.json(itinerary);
  } catch (error) {
    console.error("Error getting itinerary:", error);
    res.status(500).json({ message: "Error getting itinerary" });
  }
});

// CREATE itinerary
router.post("/", requireAuth, async (req, res) => {
  try {
    const newItinerary = new Itinerary({
      ...req.body,
      ownerEmail: req.user.email,
      favoritedBy: [],
    });

    const savedItinerary = await newItinerary.save();
    res.status(201).json(savedItinerary);
  } catch (error) {
    console.error("Error creating itinerary:", error);
    res.status(400).json({ message: "Error creating itinerary" });
  }
});

// UPDATE itinerary (owner or admin only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.ownerEmail !== req.user.email && !isAdminEmail(req.user.email)) {
      return res.status(403).json({ message: "Not authorized to update this itinerary" });
    }

    applyUpdatableFields(itinerary, req.body);
    const updatedItinerary = await itinerary.save();

    res.json(updatedItinerary);
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({ message: "Error updating itinerary" });
  }
});

// DELETE itinerary (owner or admin only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.ownerEmail !== req.user.email && !isAdminEmail(req.user.email)) {
      return res.status(403).json({ message: "Not authorized to delete this itinerary" });
    }

    await itinerary.deleteOne();
    res.json({ message: "Itinerary deleted" });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    res.status(500).json({ message: "Error deleting itinerary" });
  }
});

// FAVORITE itinerary
router.post("/:id/favorite", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (!itinerary.favoritedBy.includes(req.user.email)) {
      itinerary.favoritedBy.push(req.user.email);
      await itinerary.save();
    }

    res.json(itinerary);
  } catch (error) {
    console.error("Error favoriting itinerary:", error);
    res.status(500).json({ message: "Error favoriting itinerary" });
  }
});

// UNFAVORITE itinerary
router.delete("/:id/favorite", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    itinerary.favoritedBy = itinerary.favoritedBy.filter(
      (email) => email !== req.user.email
    );

    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error("Error unfavoriting itinerary:", error);
    res.status(500).json({ message: "Error unfavoriting itinerary" });
  }
});

// ADD comment
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { rating, text, username } = req.body;

    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    itinerary.comments.push({
      username: username || req.user.name || "Anonymous",
      ownerEmail: req.user.email,
      rating,
      text,
      date: new Date(),
    });

    await itinerary.save();

    res.json(itinerary);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// UPDATE comment (author or admin only)
router.put("/:id/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const { rating, text } = req.body;

    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    const comment = itinerary.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.ownerEmail !== req.user.email && !isAdminEmail(req.user.email)) {
      return res.status(403).json({ message: "Not authorized to update this comment" });
    }

    comment.rating = rating;
    comment.text = text;

    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Error updating comment" });
  }
});

// DELETE comment (author or admin only)
router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    const comment = itinerary.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.ownerEmail !== req.user.email && !isAdminEmail(req.user.email)) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    itinerary.comments.pull(req.params.commentId);

    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

module.exports = router;
