import { createContext, useContext, useState, useEffect } from "react";
import {
  getMyItineraries,
  getFavoriteItineraries,
  deleteItinerary as deleteItineraryRequest,
  favoriteItinerary as favoriteItineraryRequest,
  unfavoriteItinerary as unfavoriteItineraryRequest,
  updateItineraryPrivacy,
} from "../services/api";
import { useAuth } from "./AuthContext";

const ItineraryContext = createContext();

function getTripId(trip) {
  return String(trip?._id || trip?.id || "");
}

function removeDuplicates(trips) {
  const seen = new Set();

  return trips.filter((trip) => {
    const id = getTripId(trip);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function ItineraryProvider({ children }) {
  const { user } = useAuth();

  const [myItineraries, setMyItineraries] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    async function resetItineraries() {
      setMyItineraries([]);
      setFavorites([]);
    }

    if (!user) {
      resetItineraries();
      return;
    }

    async function fetchMyItineraries() {
      try {
        const response = await getMyItineraries();
        setMyItineraries(response.data || []);
      } catch (error) {
        console.error("Error loading itineraries:", error);
      }
    }

    async function fetchFavorites() {
      try {
        const response = await getFavoriteItineraries();
        setFavorites(response.data || []);
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }

    fetchMyItineraries();
    fetchFavorites();
  }, [user]);

  const addItinerary = (itinerary) => {
    setMyItineraries((prev) => removeDuplicates([itinerary, ...prev]));
  };

  const updateItineraryInState = (updatedItinerary) => {
    const updatedId = getTripId(updatedItinerary);

    setMyItineraries((prev) =>
      prev.map((trip) => (getTripId(trip) === updatedId ? updatedItinerary : trip))
    );
  };

  const togglePrivacy = async (id) => {
    const trip = myItineraries.find((item) => getTripId(item) === String(id));

    if (!trip) return;

    const newPrivacy = !trip.isPublic;

    try {
      const response = await updateItineraryPrivacy(id, newPrivacy);

      setMyItineraries((prev) =>
        prev.map((item) => (getTripId(item) === String(id) ? response.data : item))
      );
    } catch (error) {
      console.error("Error updating privacy:", error);
    }
  };

  const deleteItinerary = async (id) => {
    try {
      await deleteItineraryRequest(id);
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      return;
    }

    setMyItineraries((prev) => prev.filter((item) => getTripId(item) !== String(id)));
    setFavorites((prev) => prev.filter((item) => getTripId(item) !== String(id)));
  };

  const toggleFavorite = async (itinerary) => {
    const tripId = getTripId(itinerary);
    const alreadyFavorited = favorites.some((f) => getTripId(f) === tripId);

    try {
      if (alreadyFavorited) {
        await unfavoriteItineraryRequest(tripId);
        setFavorites((prev) => prev.filter((f) => getTripId(f) !== tripId));
      } else {
        await favoriteItineraryRequest(tripId);
        setFavorites((prev) => removeDuplicates([itinerary, ...prev]));
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const isFavorited = (id) =>
    favorites.some((f) => getTripId(f) === String(id));

  return (
    <ItineraryContext.Provider
      value={{
        myItineraries,
        addItinerary,
        updateItineraryInState,
        togglePrivacy,
        deleteItinerary,
        favorites,
        toggleFavorite,
        isFavorited,
      }}
    >
      {children}
    </ItineraryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with its provider
export function useItineraries() {
  return useContext(ItineraryContext);
}
