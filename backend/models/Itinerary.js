const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  dayNumber: Number,
  activities: String,
  restaurants: String,
  transit: String,
  hotel: String,
  notes: String,

  // Photo URLs for this day (Cloudinary uploads or pasted links).
  photos: {
    type: [String],
    default: [],
  },

  // Places visited this day, in order. Coordinates come from geocoding when
  // the place is added in the editor.
  places: {
    type: [
      {
        _id: false,
        name: String,
        lat: Number,
        lng: Number,
      },
    ],
    default: [],
  },
});

const itinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    duration: Number,

    cost: Number,

    image: String,

    description: String,

    isPublic: {
      type: Boolean,
      default: false,
    },

    ownerUid: {
      type: String,
      required: true,
    },

    // Best-effort display value; not guaranteed to be present since some
    // Google sign-ins don't produce an email claim.
    ownerEmail: {
      type: String,
    },

    favoritedBy: {
      type: [String],
      default: [],
    },

    days: [daySchema],

    tags: {
      type: [String],
      default: [],
    },

    // Filled in by the server from the destination (OpenStreetMap geocoding).
    location: {
      lat: Number,
      lng: Number,
      label: String,
    },

    // Set when this itinerary was created with "Copy to my trips".
    copiedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
    },

    // How many times other users have copied this itinerary.
    copyCount: {
      type: Number,
      default: 0,
    },

    comments: [
      {
        username: {
          type: String,
          default: "Anonymous",
        },

        ownerUid: String,
        ownerEmail: String,

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },

        text: {
          type: String,
          required: true,
        },

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);