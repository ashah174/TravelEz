const express = require("express");
const router = express.Router();
const Itinerary = require("../models/Itinerary");
const { requireAuth, optionalAuth, requireAdmin } = require("../middleware/auth");
const { isAdminUser } = require("../config/admins");
const { TRIP_TAGS, sanitizeTags } = require("../config/tags");
const { geocodeDestination } = require("../utils/geocode");
const { presentItineraries, presentItinerary } = require("../utils/present");
const { sanitizeDays } = require("../utils/days");
const Follow = require("../models/Follow");

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
  copied: { copyCount: -1, createdAt: -1 },
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
      if (field === "tags") itinerary.tags = sanitizeTags(body.tags);
      else if (field === "days") itinerary.days = sanitizeDays(body.days);
      else itinerary[field] = body[field];
    }
  });
}

async function updateLocation(itinerary) {
  itinerary.location = (await geocodeDestination(itinerary.destination)) || undefined;
}

const MAX_REVIEW_LENGTH = 2000;

// Returns { rating, text } or { error } for a review request body.
function parseReview(body) {
  const rating = Number(body?.rating);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }
  if (!text) {
    return { error: "Please write a comment with your rating." };
  }
  if (text.length > MAX_REVIEW_LENGTH) {
    return { error: `Reviews can be at most ${MAX_REVIEW_LENGTH} characters.` };
  }

  return { rating: Math.round(rating * 10) / 10, text };
}

async function sendItinerary(res, itinerary, status = 200) {
  res.status(status).json(await presentItinerary(itinerary));
}

// GET all itineraries (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json(await presentItineraries(itineraries));
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

    res.json(await presentItineraries(itineraries));
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
//   sort       recent | rating | cost | popular | copied   (default: recent)
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
      results: await presentItineraries(result.results),
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

    res.json(await presentItineraries(itineraries));
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

    res.json(await presentItineraries(itineraries));
  } catch (error) {
    console.error("Error getting favorite itineraries:", error);
    res.status(500).json({ message: "Error getting favorite itineraries" });
  }
});

// GET public itineraries from people the current user follows
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const followees = await Follow.find({ follower: req.user.uid }).distinct("followee");

    if (followees.length === 0) {
      return res.json({ followingCount: 0, results: [] });
    }

    const limit = Math.min(Math.max(Math.floor(parseNumber(req.query.limit) || 6), 1), 24);
    const itineraries = await Itinerary.find({
      ownerUid: { $in: followees },
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      followingCount: followees.length,
      results: await presentItineraries(itineraries),
    });
  } catch (error) {
    console.error("Error getting feed:", error);
    res.status(500).json({ message: "Error getting feed" });
  }
});

// GET how many public itineraries use each tag
router.get("/tags", async (req, res) => {
  try {
    const counts = await Itinerary.aggregate([
      { $match: { isPublic: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
    ]);

    const byTag = new Map(counts.map((item) => [item._id, item.count]));
    res.json(TRIP_TAGS.map((tag) => ({ tag, count: byTag.get(tag) || 0 })));
  } catch (error) {
    console.error("Error counting tags:", error);
    res.status(500).json({ message: "Error counting tags" });
  }
});

// GET one itinerary
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary || !canViewItinerary(itinerary, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    const presented = await presentItinerary(itinerary);

    // Credit the original when this is a copy, if the viewer can see it.
    if (itinerary.copiedFrom) {
      const source = await Itinerary.findById(itinerary.copiedFrom);
      if (source && canViewItinerary(source, req.user)) {
        const presentedSource = await presentItinerary(source);
        presented.inspiredBy = {
          _id: presentedSource._id,
          title: presentedSource.title,
          author: presentedSource.author,
        };
      }
    }

    res.json(presented);
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
      days: sanitizeDays(source.days.map((day) => day.toObject())),
      isPublic: false,
      ownerUid: req.user.uid,
      ownerEmail: req.user.email || undefined,
      favoritedBy: [],
      comments: [],
      copiedFrom: source._id,
    });

    const savedCopy = await copy.save();

    if (source.ownerUid !== req.user.uid) {
      await Itinerary.updateOne({ _id: source._id }, { $inc: { copyCount: 1 } });
    }

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
    const review = parseReview(req.body);
    if (review.error) {
      return res.status(400).json({ message: review.error });
    }

    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary || !canViewItinerary(itinerary, req.user)) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    if (itinerary.ownerUid === req.user.uid) {
      return res.status(403).json({ message: "You can't review your own itinerary." });
    }

    if (itinerary.comments.some((comment) => comment.ownerUid === req.user.uid)) {
      return res.status(409).json({
        message: "You've already reviewed this itinerary. Edit your review instead.",
      });
    }

    const { rating, text } = review;
    const username =
      typeof req.body.username === "string" ? req.body.username.trim().slice(0, 100) : "";

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
    const review = parseReview(req.body);
    if (review.error) {
      return res.status(400).json({ message: review.error });
    }
    const { rating, text } = review;

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
