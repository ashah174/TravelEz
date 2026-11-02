import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { getPublicItineraries } from "../services/api";
import { useItineraries } from "../context/ItineraryContext";


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

  const allPublic = publicTrips.filter(
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