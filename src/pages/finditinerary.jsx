import { Search } from "lucide-react";
import SearchBar from "../components/searchbar";

function FindItinerary() {
  return (
    <div className="page">
      <section className="hero exciting-hero">
        <Search size={48} className="hero-icon" />
        <h1>
          Find an <span>Itinerary</span>
        </h1>
        <p>Search by destination to explore travel plans from other travelers.</p>
        <SearchBar />
      </section>
    </div>
  );
}

export default FindItinerary;
