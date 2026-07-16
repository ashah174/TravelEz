import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { searchItineraries } from "../services/api";
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

  const sampleResults = search
    ? communityItineraries.filter((trip) => {
        const title = trip.title?.toLowerCase() || "";
        const tripDest = trip.destination?.toLowerCase() || "";
        return title.includes(search) || tripDest.includes(search);
      })
    : communityItineraries;

  const dbIds = new Set(dbResults.map((t) => String(t._id || t.id)));
  const localIds = new Set(localResults.map((t) => String(t._id || t.id)));

  const combined = [
    ...dbResults,
    ...localResults.filter((t) => !dbIds.has(String(t._id || t.id))),
    ...sampleResults.filter((t) => !dbIds.has(String(t.id)) && !localIds.has(String(t.id))),
  ];

  const sorted = [...combined].sort((a, b) => {
    if (sortBy === "rating") {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    }
    if (sortBy === "cost") {
      return (a.cost || 0) - (b.cost || 0);
    }
    return 0;
  });

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
