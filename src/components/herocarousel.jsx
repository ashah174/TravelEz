import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { optimizedImageUrl } from "../utils/images";
import { formatRating, getAverageRating } from "../utils/rating";
import { getTripPhotos, pickMostStrikingPhoto } from "../utils/pickPhoto";

const SLIDE_MS = 6000;
const SWIPE_PX = 40;

function HeroSlide({ trip, first }) {
  const photos = getTripPhotos(trip);
  const photosKey = JSON.stringify(photos);
  const hasCover = photos[0] === trip.image;
  const [pick, setPick] = useState({ key: null, url: null });
  const [loaded, setLoaded] = useState(false);

  // Only a trip with day photos needs comparing; otherwise use its only photo.
  useEffect(() => {
    const list = JSON.parse(photosKey);
    if (list.length < 2) return;

    let ignore = false;

    pickMostStrikingPhoto(list, hasCover).then((url) => {
      if (!ignore) setPick({ key: photosKey, url });
    });

    return () => {
      ignore = true;
    };
  }, [photosKey, hasCover]);

  const photo = photos.length === 1 ? photos[0] : pick.key === photosKey ? pick.url : null;

  return (
    <div className="home-hero-slide">
      {photo && (
        <img
          className={`home-hero-photo ${loaded ? "home-hero-photo--loaded" : ""}`}
          src={optimizedImageUrl(photo, 1920)}
          alt=""
          fetchPriority={first ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

// The Home hero: trip photos slide behind content that stays in place, with a
// credit for whichever trip is showing. It advances by itself until the visitor
// uses the dots or swipes, and not at all if they've asked for reduced motion.
function HeroCarousel({ trips, children }) {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const count = trips.length;
  const active = Math.min(index, Math.max(count - 1, 0));
  const trip = trips[active];
  const rating = trip && formatRating(getAverageRating(trip));

  useEffect(() => {
    if (count < 2 || stopped || paused) return;

    const timer = setTimeout(() => setIndex((active + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active, count, stopped, paused]);

  const showSlide = (next) => {
    setStopped(true);
    setIndex((next + count) % count);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || count < 2) return;

    const distance = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) >= SWIPE_PX) showSlide(active + (distance < 0 ? 1 : -1));
  };

  return (
    <section
      className="home-hero"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="home-hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {trips.map((slide, slideIndex) => (
          <HeroSlide key={slide._id} trip={slide} first={slideIndex === 0} />
        ))}
      </div>

      {children}

      {trip && (
        <div
          className="home-hero-meta"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <p className="home-hero-credit">
            {rating && (
              <span className="home-hero-rating">
                <Star size={13} fill="currentColor" /> {rating}
              </span>
            )}
            <span>
              <Link to={`/itinerary/${trip._id}`}>{trip.title}</Link>
              {trip.author?.uid && (
                <>
                  {" "}
                  by{" "}
                  <Link to={`/u/${trip.author.uid}`}>
                    {trip.author.name || "TravelEz traveler"}
                  </Link>
                </>
              )}
            </span>
          </p>

          {count > 1 && (
            <div className="home-hero-dots">
              {trips.map((slide, slideIndex) => (
                <button
                  key={slide._id}
                  type="button"
                  className={`home-hero-dot ${slideIndex === active ? "home-hero-dot--active" : ""}`}
                  onClick={() => showSlide(slideIndex)}
                  aria-label={`Show ${slide.title}`}
                  aria-current={slideIndex === active ? "true" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default HeroCarousel;
