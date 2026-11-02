const express = require("express");
const router = express.Router();
const Itinerary = require("../models/Itinerary");
const { requireAuth, optionalAuth, requireAdmin } = require("../middleware/auth");
const { isAdminUser } = require("../config/admins");
const { sanitizeTags } = require("../config/tags");
const { geocodeDestination } = require("../utils/geocode");
const { attachAuthors, attachAuthor } = require("../utils/authors");

const UPDATABLE_FIELDS = [
  "title",
  "destination",
  "duration",
  "cost",
  "image",
  "description",
  "isPublic",
  "days",
  "tags",
];

const SORTS = {
  recent: { createdAt: -1 },
  rating: { avgRating: -1, reviewCount: -1, createdAt: -1 },
  cost: { cost: 1, createdAt: -1 },
  popular: { favoriteCount: -1, createdAt: -1 },
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

function canViewItinerary(itinerary, user) {
  if (itinerary.isPublic) return true;
  return !!user && (itinerary.ownerUid === user.uid || isAdminUser(user));
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumber(value) {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function applyUpdatableFields(itinerary, body) {
  UPDATABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      itinerary[field] = field === "tags" ? sanitizeTags(body[field]) : body[field];
    }
  });
}

async function updateLocation(itinerary) {
  itinerary.location = (await geocodeDestination(itinerary.destination)) || undefined;
}

async function sendItinerary(res, itinerary, status = 200) {
  res.status(status).json(await attachAuthor(itinerary));
}

// GET all itineraries (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json(await attachAuthors(itineraries));
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

    res.json(await attachAuthors(itineraries));
  } catch (error) {
    console.error("Error fetching public itineraries:", error);
    res.status(500).json({ message: "Error fetching public itineraries" });
  }
});

// GET search results (public itineraries only)
//
// Query params (all optional):
//   q          text matched against title, destination and description
//              (`destination` is accepted as an alias)
//   tags       comma-separated; trips must have all of them
//   minCost, maxCost, minDays, maxDays
//   sort       recent | rating | cost | popular   (default: recent)
//   page, limit
//
// Responds with { results, total, page, pages }.
router.get("/search", async (req, res) => {
  try {
    const text = String(req.query.q ?? req.query.destination ?? "").trim();
    const tags = sanitizeTags(String(req.query.tags || "").split(","));
    const minCost = parseNumber(req.query.minCost);
    const maxCost = parseNumber(req.query.maxCost);
    const minDays = parseNumber(req.query.minDays);
    const maxDays = parseNumber(req.query.maxDays);
    const sort = SORTS[req.query.sort] || SORTS.recent;

    const limit = Math.min(
      Math.max(Math.floor(parseNumber(req.query.limit) || DEFAULT_PAGE_SIZE), 1),
      MAX_PAGE_SIZE
    );
    const page = Math.max(Math.floor(parseNumber(req.query.page) || 1), 1);

    const match = { isPublic: true };

    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: "i" };
      match.$or = [{ title: pattern }, { destination: pattern }, { description: pattern }];
    }

    if (tags.length) match.tags = { $all: tags };

    if (minCost !== undefined || maxCost !== undefined) {
      match.cost = {};
      if (minCost !== undefined) match.cost.$gte = minCost;
      if (maxCost !== undefined) match.cost.$lte = maxCost;
    }

    if (minDays !== undefined || maxDays !== undefined) {
      match.duration = {};
      if (minDays !== undefined) match.duration.$gte = minDays;
      if (maxDays !== undefined) match.duration.$lte = maxDays;
    }

    const [result] = await Itinerary.aggregate([
      { $match: match },
      {
        $addFields: {
          avgRating: { $avg: "$comments.rating" },
          reviewCount: { $size: { $ifNull: ["$comments", []] } },
          favoriteCount: { $size: { $ifNull: ["$favoritedBy", []] } },
        },
      },
      { $sort: sort },
      {
        $facet: {
          results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const total = result.total[0]?.count || 0;

    res.json({
      results: await attachAuthors(result.results),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error("Error searching itineraries:", error);
    res.status(500).json({ message: "Error searching itineraries" });
  }
});

// GET itineraries owned by the current user
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      ownerUid: req.user.uid,
    }).sort({ createdAt: -1 });

    res.json(await attachAuthors(itineraries));
  } catch (error) {
    console.error("Error getting your itineraries:", error);
    res.status(500).json({ message: "Error getting your itineraries" });
  }
});

// GET itineraries favorited by the current user
router.get("/favorites", requireAuth, async (req, res) => {
  try {
    // A favorited trip may since have been made private; only return it if
    // the requester can still see it.
    const itineraries = await Itinerary.find({
      favoritedBy: req.user.uid,
      $or: [{ isPublic: true }, { ownerUid: req.user.uid }],
    }).sort({ createdAt: -1 });

    res.json(await attachAuthors(itineraries));
  } catch (error) {
    console.error("Error getting favorite itineraries:", error);
    res.status(500).json({ message: "Error getting favorite itineraries" });
  }
});

// GET one itinerary
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary || !canViewItinerary(itinerary, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    await sendItinerary(res, itinerary);
  } catch (error) {
    console.error("Error getting itinerary:", error);
    res.status(500).json({ message: "Error getting itinerary" });
  }
});

// CREATE itinerary
router.post("/", requireAuth, async (req, res) => {
  try {
    const newItinerary = new Itinerary({
      ownerUid: req.user.uid,
      ownerEmail: req.user.email || undefined,
      favoritedBy: [],
    });

    applyUpdatableFields(newItinerary, req.body);
    await updateLocation(newItinerary);

    const savedItinerary = await newItinerary.save();
    await sendItinerary(res, savedItinerary, 201);
  } catch (error) {
    console.error("Error creating itinerary:", error);
    res.status(400).json({ message: "Error creating itinerary" });
  }
});

// COPY a visible itinerary into the current user's trips as a private draft
router.post("/:id/copy", requireAuth, async (req, res) => {
  try {
    const source = await Itinerary.findById(req.params.id);

    if (!source || !canViewItinerary(source, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    const copy = new Itinerary({
      title: source.title,
      destination: source.destination,
      duration: source.duration,
      cost: source.cost,
      image: source.image,
      description: source.description,
      tags: source.tags,
      location: source.location?.lat != null ? source.location : undefined,
      days: source.days.map((day) => {
        const { _id, ...rest } = day.toObject();
        return rest;
      }),
      isPublic: false,
      ownerUid: req.user.uid,
      ownerEmail: req.user.email || undefined,
      favoritedBy: [],
      comments: [],
      copiedFrom: source._id,
    });

    const savedCopy = await copy.save();
    await sendItinerary(res, savedCopy, 201);
  } catch (error) {
    console.error("Error copying itinerary:", error);
    res.status(500).json({ message: "Error copying itinerary" });
  }
});

// CLAIM itinerary (only if it has no owner yet)
router.post("/:id/claim", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.ownerUid) {
      return res.status(409).json({ message: "Itinerary already has an owner" });
    }

    itinerary.ownerUid = req.user.uid;
    if (req.user.email) itinerary.ownerEmail = req.user.email;
    const claimedItinerary = await itinerary.save();

    await sendItinerary(res, claimedItinerary);
  } catch (error) {
    console.error("Error claiming itinerary:", error);
    res.status(500).json({ message: "Error claiming itinerary" });
  }
});

// UPDATE itinerary (owner or admin only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.ownerUid !== req.user.uid && !isAdminUser(req.user)) {
      return res.status(403).json({ message: "Not authorized to update this itinerary" });
    }

    const previousDestination = itinerary.destination;
    applyUpdatableFields(itinerary, req.body);

    if (itinerary.destination !== previousDestination || itinerary.location?.lat == null) {
      await updateLocation(itinerary);
    }

    const updatedItinerary = await itinerary.save();
    await sendItinerary(res, updatedItinerary);
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

    if (itinerary.ownerUid !== req.user.uid && !isAdminUser(req.user)) {
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

    if (!itinerary || !canViewItinerary(itinerary, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (!itinerary.favoritedBy.includes(req.user.uid)) {
      itinerary.favoritedBy.push(req.user.uid);
      await itinerary.save();
    }

    await sendItinerary(res, itinerary);
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
      (uid) => uid !== req.user.uid
    );

    await itinerary.save();
    res.json({ message: "Removed from favorites" });
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

    if (!itinerary || !canViewItinerary(itinerary, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    itinerary.comments.push({
      username: username || req.user.name || "Anonymous",
      ownerUid: req.user.uid,
      ownerEmail: req.user.email || undefined,
      rating,
      text,
      date: new Date(),
    });

    await itinerary.save();
    await sendItinerary(res, itinerary);
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

    if (comment.ownerUid !== req.user.uid && !isAdminUser(req.user)) {
      return res.status(403).json({ message: "Not authorized to update this comment" });
    }

    comment.rating = rating;
    comment.text = text;

    await itinerary.save();
    await sendItinerary(res, itinerary);
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

    if (comment.ownerUid !== req.user.uid && !isAdminUser(req.user)) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    itinerary.comments.pull(req.params.commentId);

    await itinerary.save();
    await sendItinerary(res, itinerary);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

module.exports = router;
