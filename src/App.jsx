import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import TabBar from "./components/tabbar";
import Home from "./pages/home";
import ItineraryDetail from "./pages/itinerarydetail";
import Profile from "./pages/profile";
import SearchResults from "./pages/searchresults";
import CreateItinerary from "./pages/createitinerary";
import Favorites from "./pages/favorites";
import MyItineraries from "./pages/myitineraries";
import UserProfile from "./pages/userprofile";
import TagPage from "./pages/tagpage";
import TagsIndex from "./pages/tagsindex";
import { AuthProvider } from "./context/AuthContext";
import { ItineraryProvider } from "./context/ItineraryContext";
import "./App.css";


function App() {
  return (
    <AuthProvider>
      <ItineraryProvider>
        <Router>
          <Navbar />

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/itinerary/:id" element={<ItineraryDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/results" element={<SearchResults />} />
              <Route path="/create" element={<CreateItinerary />} />
              <Route path="/search" element={<Navigate to="/results" replace />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/my-itineraries" element={<MyItineraries />} />
              <Route path="/public" element={<Navigate to="/results" replace />} />
              <Route path="/u/:uid" element={<UserProfile />} />
              <Route path="/tags" element={<TagsIndex />} />
              <Route path="/tags/:slug" element={<TagPage />} />
              <Route path="/edit-itinerary/:id" element={<CreateItinerary editMode={true} />} />
            </Routes>
          </main>

          <Footer />
          <TabBar />
        </Router>
      </ItineraryProvider>
    </AuthProvider>
  );
}

export default App;
