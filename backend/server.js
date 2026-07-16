const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const itineraryRoutes = require("./routes/itineraries");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/itineraries", itineraryRoutes);

app.get("/", (req, res) => {
  res.send("TravelEz backend is running");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5001, () => {
      console.log(`Server running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });