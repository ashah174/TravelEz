// One-off backfill: adds map coordinates to itineraries saved before
// geocoding existed. Run from the backend folder:  node scripts/geocode-missing.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Itinerary = require("../models/Itinerary");
const { geocodeDestination } = require("../utils/geocode");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const missing = await Itinerary.find({ "location.lat": { $exists: false } });
  console.log(`${missing.length} itineraries without coordinates`);

  let updated = 0;
  for (const itinerary of missing) {
    const location = await geocodeDestination(itinerary.destination);
    if (location) {
      await Itinerary.updateOne({ _id: itinerary._id }, { $set: { location } });
      updated += 1;
      console.log(`✓ ${itinerary.destination} → ${location.lat}, ${location.lng}`);
    } else {
      console.log(`✗ ${itinerary.destination} (no match)`);
    }
  }

  console.log(`Done: ${updated}/${missing.length} updated`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
