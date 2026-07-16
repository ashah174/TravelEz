import ItineraryCard from "../components/itinerarycard";
import { Link } from "react-router-dom";
import { PlusCircle, Search, Heart, Sparkles } from "lucide-react";
import logo from "../images/travelezlogo.jpg";

const sampleItineraries = [
  {
    id: 1,
    title: "5 Days in Paris",
    destination: "Paris, France",
    duration: 5,
    cost: 1200,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  },
  {
    id: 2,
    title: "Japan Food Tour",
    destination: "Tokyo, Japan",
    duration: 7,
    cost: 1800,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
  },
  {
    id: 3,
    title: "Budget Weekend in NYC",
    destination: "New York City",
    duration: 3,
    cost: 600,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625",
  },
];

function Home() {
  return (
    <div className="page">
      <section className="hero exciting-hero">

        <img
          src={logo}
          alt="TravelEz logo"
          className="hero-logo"
        />

        <h1>
          Find and Share <span>Itineraries</span>
        </h1>

        <p>
          Discover amazing travel plans, create your own adventures,
          and share them with other travelers.
        </p>

        <div className="hero-actions">

          <Link to="/create" className="hero-btn primary">
            <PlusCircle size={28} />
            <div>
              <strong>Create Your Own Itinerary</strong>
              <small>Plan Your Next Adventure</small>
            </div>
          </Link>

          <Link to="/search" className="hero-btn secondary">
            <Search size={28} />
            <div>
              <strong>Find an Itinerary</strong>
              <small>Explore Travel Plans</small>
            </div>
          </Link>

          <Link to="/favorites" className="hero-btn favorite">
            <Heart size={28} />
            <div>
              <strong>View Favorite Itineraries</strong>
              <small>View Your Saved Trips</small>
            </div>
          </Link>

        </div>
      </section>

      <h2 className="section-heading">
        <Sparkles size={22} className="star-icon" /> Recommended Itineraries
      </h2>

      <div className="card-grid">
        {sampleItineraries.map((trip) => (
          <ItineraryCard key={trip.id} itinerary={trip} />
        ))}
      </div>
    </div>
  );
}

export default Home;