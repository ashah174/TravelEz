const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  dayNumber: Number,
  activities: String,
  restaurants: String,
  transit: String,
  hotel: String,
  notes: String,
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

    ownerEmail: {
      type: String,
      required: true,
    },

    favoritedBy: {
      type: [String],
      default: [],
    },

    days: [daySchema],

    comments: [
      {
        username: {
          type: String,
          default: "Anonymous",
        },

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