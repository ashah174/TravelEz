// Allowed trip tags. Keep in sync with backend/config/tags.js.
export const TRIP_TAGS = [
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

// Headline and blurb for each tag's page at /tags/<slug>.
export const TAG_DETAILS = {
  Food: { heading: "Best Food Trips", blurb: "Markets, street food, and restaurants worth planning a whole day around." },
  Budget: { heading: "Best Budget Trips", blurb: "Itineraries that stretch every dollar without skipping the good parts." },
  Luxury: { heading: "Best Luxury Trips", blurb: "Splurge-worthy stays, fine dining, and once-in-a-lifetime experiences." },
  Adventure: { heading: "Best Adventure Trips", blurb: "Hikes, dives, and days that end with a good story." },
  Culture: { heading: "Best Culture Trips", blurb: "Museums, history, architecture, and local traditions." },
  Nature: { heading: "Best Nature Trips", blurb: "National parks, mountains, lakes, and wide-open landscapes." },
  Beach: { heading: "Best Beach Trips", blurb: "Sun, sand, and the best stretches of coastline." },
  City: { heading: "Best City Trips", blurb: "Neighborhoods, skylines, and how to see a city like a local." },
  Nightlife: { heading: "Best Nightlife Trips", blurb: "Bars, live music, and cities that come alive after dark." },
  Family: { heading: "Best Family Trips", blurb: "Plans that keep kids and grown-ups happy." },
  Romantic: { heading: "Best Romantic Trips", blurb: "Getaways for two, from honeymoons to anniversaries." },
  "Road Trip": { heading: "Best Road Trips", blurb: "Routes, stops, and scenic drives worth taking slowly." },
};

export function tagSlug(tag) {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

export function tagFromSlug(slug) {
  return TRIP_TAGS.find((tag) => tagSlug(tag) === String(slug).toLowerCase()) || null;
}

export function tagPath(tag) {
  return `/tags/${tagSlug(tag)}`;
}
