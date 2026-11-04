const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { geocodeDestination } = require("../utils/geocode");

const MAX_QUERY_LENGTH = 200;

// GET /api/geocode?q=Louvre&near=Paris, France
// Looks a place up, first near the trip's destination, then on its own.
// Signed-in only, and shares the server's 1-request-per-second Nominatim queue.
router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, MAX_QUERY_LENGTH);
  const near = String(req.query.near || "").trim().slice(0, MAX_QUERY_LENGTH);

  if (!q) {
    return res.status(400).json({ message: "Enter a place to look up." });
  }

  let result = near ? await geocodeDestination(`${q}, ${near}`) : null;
  if (!result) result = await geocodeDestination(q);

  if (!result) {
    return res.status(404).json({ message: `Couldn't find "${q}" on the map.` });
  }

  res.json(result);
});

module.exports = router;
