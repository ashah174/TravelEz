import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { searchItineraries } from "../services/api";
import { useItineraries } from "../context/ItineraryContext";
import { sortTrips } from "../utils/rating";


function SearchResults() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const destination = params.get("destination") || "";

  const { myItineraries = [] } = useItineraries();
  const [dbResults, setDbResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const search = destination.toLowerCase().trim();

  useEffect(() => {
    const clearResults = async () => {
      setDbResults([]);
    };

    if (!destination.trim()) {
      clearResults();
      return;
    }

    const fetchFromDB = async () => {
      setLoading(true);
      try {
        const response = await searchItineraries(destination);
        setDbResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
        setDbResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFromDB();
  }, [destination]);

  const localResults = search
    ? myItineraries.filter((trip) => {
        const title = trip.title?.toLowerCase() || "";
        const tripDest = trip.destination?.toLowerCase() || "";
        const desc = trip.description?.toLowerCase() || "";
        return title.includes(search) || tripDest.includes(search) || desc.includes(search);
      })
    : myItineraries;

  const dbIds = new Set(dbResults.map((t) => String(t._id || t.id)));

  const combined = [
    ...dbResults,
    ...localResults.filter((t) => !dbIds.has(String(t._id || t.id))),
  ];

  const sorted = sortTrips(combined, sortBy);

  return (
    <div className="page">
      <h1>Search Results</h1>
      <p>Showing results for: {destination || "All destinations"}</p>

      <div className="filters">
        <button
          className={sortBy === "rating" ? "filter-active" : ""}
          onClick={() => setSortBy("rating")}
        >
          Highest Rated
        </button>
        <button
          className={sortBy === "cost" ? "filter-active" : ""}
          onClick={() => setSortBy("cost")}
        >
          Lowest Cost
        </button>
        <button
          className={sortBy === "recent" ? "filter-active" : ""}
          onClick={() => setSortBy("recent")}
        >
          Most Recent
        </button>
      </div>

      {loading ? (
        <p>Searching...</p>
      ) : sorted.length > 0 ? (
        <div className="card-grid">
          {sorted.map((trip) => (
            <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
          ))}
        </div>
      ) : (
        <p>No itineraries found for "{destination}".</p>
      )}
    </div>
  );
}

export default SearchResults;
