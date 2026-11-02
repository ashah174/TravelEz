// Allowed trip tags. Keep in sync with src/constants/tags.js on the frontend.
const TRIP_TAGS = [
  "Food",
  "Budget",
  "Luxury",
  "Adventure",
  "Culture",
  "Nature",
  "Beach",
  "City",
  "Nightlife",
  "Family",
  "Romantic",
  "Road Trip",
];

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.filter((tag) => TRIP_TAGS.includes(tag)))];
}

module.exports = { TRIP_TAGS, sanitizeTags };
