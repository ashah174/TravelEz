import axios from "axios";
import { auth } from "../firebase";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://travelez-8rz7.onrender.com/api",
});

API.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getItineraries = () => API.get("/itineraries");
export const getPublicItineraries = () => API.get("/itineraries/public");
export const getMyItineraries = () => API.get("/itineraries/mine");
export const getFavoriteItineraries = () => API.get("/itineraries/favorites");
export const searchItineraries = (destination) =>
  API.get(`/itineraries/search?destination=${destination}`);
export const getItineraryById = (id) => API.get(`/itineraries/${id}`);
export const createItinerary = (data) => API.post("/itineraries", data);
export const updateItinerary = (id, data) => API.put(`/itineraries/${id}`, data);
export const deleteItinerary = (id) => API.delete(`/itineraries/${id}`);
export const favoriteItinerary = (id) => API.post(`/itineraries/${id}/favorite`);
export const unfavoriteItinerary = (id) => API.delete(`/itineraries/${id}/favorite`);
export const addCommentToItinerary = (id, data) =>
  API.post(`/itineraries/${id}/comments`, data);
export const updateCommentOnItinerary = (id, commentId, data) =>
  API.put(`/itineraries/${id}/comments/${commentId}`, data);
export const deleteCommentFromItinerary = (id, commentId) =>
  API.delete(`/itineraries/${id}/comments/${commentId}`);
export const updateItineraryPrivacy = (id, isPublic) =>
  API.put(`/itineraries/${id}`, { isPublic });


export default API;
