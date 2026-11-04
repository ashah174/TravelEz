const MAX_DAYS = 60;
const MAX_DAY_PHOTOS = 6;
const MAX_DAY_PLACES = 8;
const MAX_TEXT_LENGTH = 5000;
const MAX_URL_LENGTH = 2000;
const MAX_PLACE_NAME_LENGTH = 200;

const TEXT_FIELDS = ["activities", "restaurants", "transit", "hotel", "notes"];

function cleanText(value) {
  return typeof value === "string" ? value.slice(0, MAX_TEXT_LENGTH) : "";
}

function isHttpUrl(value) {
  return (
    typeof value === "string" &&
    value.length <= MAX_URL_LENGTH &&
    /^https?:\/\/\S+$/i.test(value.trim())
  );
}

function cleanPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return [...new Set(photos.filter(isHttpUrl).map((url) => url.trim()))].slice(
    0,
    MAX_DAY_PHOTOS
  );
}

function cleanPlaces(places) {
  if (!Array.isArray(places)) return [];

  return places
    .map((place) => ({
      name: typeof place?.name === "string" ? place.name.trim().slice(0, MAX_PLACE_NAME_LENGTH) : "",
      lat: Number(place?.lat),
      lng: Number(place?.lng),
    }))
    .filter(
      (place) =>
        place.name &&
        Number.isFinite(place.lat) &&
        Number.isFinite(place.lng) &&
        Math.abs(place.lat) <= 90 &&
        Math.abs(place.lng) <= 180
    )
    .slice(0, MAX_DAY_PLACES);
}

// Keeps only known day fields, in a safe shape, and renumbers the days.
function sanitizeDays(days) {
  if (!Array.isArray(days)) return [];

  return days.slice(0, MAX_DAYS).map((day, index) => {
    const clean = { dayNumber: index + 1 };
    TEXT_FIELDS.forEach((field) => {
      clean[field] = cleanText(day?.[field]);
    });
    clean.photos = cleanPhotos(day?.photos);
    clean.places = cleanPlaces(day?.places);
    return clean;
  });
}

module.exports = { sanitizeDays, MAX_DAY_PHOTOS, MAX_DAY_PLACES };
