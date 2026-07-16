import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createItinerary,
  getItineraryById,
  updateItinerary,
} from "../services/api";
import {
  PlusCircle,
  MapPin,
  DollarSign,
  Image,
  Utensils,
  Bus,
  BedDouble,
  NotebookPen,
  Footprints,
  Plus,
  Trash2,
} from "lucide-react";
import { useItineraries } from "../context/ItineraryContext";

const emptyDay = () => ({
  activities: "",
  restaurants: "",
  transit: "",
  hotel: "",
  other: "",
});

function CreateItinerary({ editMode = false }) {
  const { addItinerary, updateItineraryInState } = useItineraries();
  const navigate = useNavigate();
  const { id } = useParams();

  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    destination: "",
    cost: "",
    image: "",
    description: "",
  });

  const [days, setDays] = useState([emptyDay()]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const loadItinerary = async () => {
      if (!editMode || !id) return;

      try {
        const response = await getItineraryById(id);
        const trip = response.data;

        setForm({
          title: trip.title || "",
          destination: trip.destination || "",
          cost: trip.cost || "",
          image: trip.image || "",
          description: trip.description || "",
        });

        setIsPublic(trip.isPublic || false);

        setDays(
          trip.days?.length
            ? trip.days.map((day) => ({
                activities: day.activities || "",
                restaurants: day.restaurants || "",
                transit: day.transit || "",
                hotel: day.hotel || "",
                other: day.other || day.notes || "",
              }))
            : [emptyDay()]
        );
      } catch (error) {
        console.error("Error loading itinerary:", error);
      }
    };

    loadItinerary();
  }, [editMode, id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDayChange = (index, field, value) => {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const addDay = () => setDays((prev) => [...prev, emptyDay()]);

  const removeDay = (index) =>
    setDays((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItinerary = {
      title: form.title,
      destination: form.destination,
      duration: days.length,
      cost: Number(form.cost) || 0,
      image:
        form.image ||
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
      description: form.description,
      isPublic: editMode ? isPublic : false,
      days: days.map((day, index) => ({
        dayNumber: index + 1,
        activities: day.activities,
        restaurants: day.restaurants,
        transit: day.transit,
        hotel: day.hotel,
        notes: day.other,
      })),
    };

    try {
      const response = editMode
        ? await updateItinerary(id, newItinerary)
        : await createItinerary(newItinerary);

        if (editMode) {
          updateItineraryInState(response.data);
        } else {
          addItinerary(response.data);
        }
        

      setSuccessMessage(
        editMode
          ? "Itinerary updated successfully!"
          : "Itinerary created successfully!"
      );

      setTimeout(() => {
        navigate("/my-itineraries");
      }, 1200);
    } catch (error) {
      console.error("Error saving itinerary:", error);
    }
  };

  return (
    <div className="page create-page">
      <section className="create-hero">
        <PlusCircle size={48} />
        <h1>{editMode ? "Edit Your Itinerary" : "Create Your Own Itinerary"}</h1>
        <p>
          {editMode
            ? "Update your travel plan and save your changes."
            : "Build a custom travel plan and share it with other travelers."}
        </p>
      </section>

      {successMessage && <div className="success-toast">{successMessage}</div>}

      <form className="itinerary-form" onSubmit={handleSubmit}>
        <div className="form-section-label">Trip Details</div>

        <label>
          Trip Title
          <input
            type="text"
            name="title"
            placeholder="Ex: 5 Days in Paris"
            value={form.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Destination
          <div className="input-icon">
            <MapPin size={20} />
            <input
              type="text"
              name="destination"
              placeholder="Ex: Paris, France"
              value={form.destination}
              onChange={handleChange}
              required
            />
          </div>
        </label>

        <label>
          Estimated Cost ($)
          <div className="input-icon">
            <DollarSign size={20} />
            <input
              type="number"
              name="cost"
              placeholder="Ex: 1200"
              value={form.cost}
              onChange={handleChange}
              min="0"
            />
          </div>
        </label>

        <label>
          Cover Image URL
          <div className="input-icon">
            <Image size={20} />
            <input
              type="text"
              name="image"
              placeholder="Paste an image URL (optional)"
              value={form.image}
              onChange={handleChange}
            />
          </div>
        </label>

        <label>
          Trip Overview
          <textarea
            name="description"
            placeholder="Give a short overview of your trip..."
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
        </label>

        <div className="form-section-label" style={{ marginTop: "12px" }}>
          Day-by-Day Schedule
          <span className="form-section-sub">
            {" "}
            — {days.length} day{days.length !== 1 ? "s" : ""}
          </span>
        </div>

        {days.map((day, index) => (
          <div key={index} className="day-form-card">
            <div className="day-form-header">
              <span className="day-form-title">
                Day {index + 1}
                {index === 0 && <span className="required-tag"> Required</span>}
              </span>

              {index > 0 && (
                <button
                  type="button"
                  className="remove-day-btn"
                  onClick={() => removeDay(index)}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>

            <div className="day-subfields">
              <label className="day-subfield">
                <span className="subfield-label">
                  <Footprints size={15} /> Activities
                </span>
                <textarea
                  placeholder="What will you do? (optional)"
                  rows="2"
                  value={day.activities}
                  onChange={(e) =>
                    handleDayChange(index, "activities", e.target.value)
                  }
                />
              </label>

              <label className="day-subfield">
                <span className="subfield-label">
                  <Utensils size={15} /> Restaurants
                </span>
                <textarea
                  placeholder="Where will you eat? (optional)"
                  rows="2"
                  value={day.restaurants}
                  onChange={(e) =>
                    handleDayChange(index, "restaurants", e.target.value)
                  }
                />
              </label>

              <label className="day-subfield">
                <span className="subfield-label">
                  <Bus size={15} /> Transit Info
                </span>
                <textarea
                  placeholder="Flights, trains, buses... (optional)"
                  rows="2"
                  value={day.transit}
                  onChange={(e) =>
                    handleDayChange(index, "transit", e.target.value)
                  }
                />
              </label>

              <label className="day-subfield">
                <span className="subfield-label">
                  <BedDouble size={15} /> Hotel / Accommodation
                </span>
                <textarea
                  placeholder="Where are you staying? (optional)"
                  rows="2"
                  value={day.hotel}
                  onChange={(e) =>
                    handleDayChange(index, "hotel", e.target.value)
                  }
                />
              </label>

              <label className="day-subfield">
                <span className="subfield-label">
                  <NotebookPen size={15} /> Other Notes
                </span>
                <textarea
                  placeholder="Anything else to note? (optional)"
                  rows="2"
                  value={day.other}
                  onChange={(e) =>
                    handleDayChange(index, "other", e.target.value)
                  }
                />
              </label>
            </div>
          </div>
        ))}

        <button type="button" className="add-day-btn" onClick={addDay}>
          <Plus size={18} /> Add Day {days.length + 1}
        </button>

        <button type="submit" className="submit-itinerary-btn">
          {editMode ? "Update Itinerary" : "Save Itinerary"}
        </button>
      </form>
    </div>
  );
}

export default CreateItinerary;