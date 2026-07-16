import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { getPublicItineraries } from "../services/api";
import { useItineraries } from "../context/ItineraryContext";

const communityItineraries = [
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

function PublicItineraries() {
  const { deleteItinerary } = useItineraries();
  const [publicTrips, setPublicTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPublicTrips = async () => {
      try {
        const response = await getPublicItineraries();
        setPublicTrips(response.data);
      } catch (error) {
        console.error("Error loading public itineraries:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPublicTrips();
  }, []);

  const [deletedIds, setDeletedIds] = useState([]);

  const handleAdminDelete = async (id) => {
    await deleteItinerary(id);
    setDeletedIds((prev) => [...prev, String(id)]);
  };

  const allPublic = [...publicTrips, ...communityItineraries].filter(
    (trip) => !deletedIds.includes(String(trip._id || trip.id))
  );

  return (
    <div className="page">
      <section className="hero exciting-hero" style={{ marginBottom: "36px" }}>
        <Globe size={48} className="hero-icon" />
        <h1>
          Public <span>Itineraries</span>
        </h1>
        <p>
          Browse travel plans shared by the community — and your own public
          trips.
        </p>
      </section>

      <div className="public-itineraries-meta">
        {loading ? (
          <p>Loading public itineraries...</p>
        ) : (
          <p>
            {allPublic.length} itinerar
            {allPublic.length === 1 ? "y" : "ies"} available
          </p>
        )}

        {!loading && publicTrips.length === 0 && (
          <p className="public-hint">
            Share one of your trips from{" "}
            <Link to="/my-itineraries">My Itineraries</Link> to see it here.
          </p>
        )}
      </div>

      <div className="card-grid">
        {allPublic.map((trip) => (
          <ItineraryCard
            key={trip._id || trip.id}
            itinerary={trip}
            onDelete={handleAdminDelete}
          />
        ))}
      </div>
    </div>
  );
}
export default PublicItineraries;