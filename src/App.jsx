import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import ItineraryDetail from "./pages/itinerarydetail";
import Profile from "./pages/profile";
import SearchResults from "./pages/searchresults";
import CreateItinerary from "./pages/createitinerary";
import FindItinerary from "./pages/finditinerary";
import Favorites from "./pages/favorites";
import MyItineraries from "./pages/myitineraries";
import PublicItineraries from "./pages/publicitineraries";
import { AuthProvider } from "./context/AuthContext";
import { ItineraryProvider } from "./context/ItineraryContext";
import "./App.css";


function App() {
  return (
    <AuthProvider>
      <ItineraryProvider>
        <Router>
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/itinerary/:id" element={<ItineraryDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/results" element={<SearchResults />} />
            <Route path="/create" element={<CreateItinerary />} />
            <Route path="/search" element={<FindItinerary />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-itineraries" element={<MyItineraries />} />
            <Route path="/public" element={<PublicItineraries />} />
            <Route path="/edit-itinerary/:id" element={<CreateItinerary editMode={true} />} />
          </Routes>
        </Router>
      </ItineraryProvider>
    </AuthProvider>
  );
}

export default App;
