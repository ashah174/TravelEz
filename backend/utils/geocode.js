// Looks up coordinates for a destination using OpenStreetMap's Nominatim.
// Usage policy: at most 1 request per second and an identifying User-Agent.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TravelEz/1.0 (+https://github.com/ashah174/TravelEz)";
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 5000;

let queue = Promise.resolve();
let lastRequestAt = 0;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function lookup(destination) {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) await wait(MIN_INTERVAL_MS - elapsed);
  lastRequestAt = Date.now();

  const url = `${NOMINATIM_URL}?${new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
  })}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);

  const [match] = await response.json();
  if (!match) return null;

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
    label: match.display_name,
  };
}

// Returns { lat, lng, label } or null. Never throws: a failed lookup must not
// block saving an itinerary.
function geocodeDestination(destination) {
  const text = String(destination || "").trim();
  if (!text) return Promise.resolve(null);

  const result = queue.then(() => lookup(text));
  queue = result.catch(() => {});

  return result.catch((error) => {
    console.error(`Geocoding failed for "${text}":`, error.message);
    return null;
  });
}

module.exports = { geocodeDestination };
