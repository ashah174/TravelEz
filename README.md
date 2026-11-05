# TravelEz

TravelEz is a travel itinerary sharing site built around copying real trips. Find a trip from someone who's actually been there, copy it to your account, and make it yours. You can also plan your own day by day, share it publicly, and follow other travelers. It works on desktop and can be installed on a phone like an app.

## What Works

**Trips**
- Create, edit, and delete trips with day-by-day schedules
- Upload cover and day photos, or paste an image link
- Pin places for each day, shown as numbered, color-coded map pins with a route line
- Keep trips private or share them publicly
- Copy another traveler's trip into your own account, with credit shown on the copy and a copy count on the original

**Discovering trips**
- Search by text and filter by budget, trip length, and tags
- Sort by most recent, highest rated, most favorited, most copied, or lowest cost
- Browse tag pages such as `/tags/food`
- See a "From People You Follow" section on the homepage

**People**
- Sign in with Google
- Favorite trips
- Leave one rating and review per trip, then edit or delete it
- View public profiles and follow other travelers

**Design and phone app**
- Photo-first design with automatic dark mode
- Sticky map on desktop trip pages
- Bottom tab bar and a fixed Copy button on phones
- Installable with "Add to Home Screen"

## Tools Used
- **React** — frontend UI and component structure
- **Vite** — local dev server and build tool
- **vite-plugin-pwa** — makes the site installable as a phone app
- **React Router** — client-side page navigation
- **Leaflet / React Leaflet** — trip maps, using OpenStreetMap
- **Firebase** — Google Authentication for user login
- **Cloudinary** — photo uploads
- **Node.js / npm** — package management and running scripts
- **Express.js** — backend API
- **MongoDB Atlas** — cloud database
- **Mongoose** — MongoDB schema and data modeling
- **Nominatim (OpenStreetMap)** — finds map coordinates for destinations and places

## Project Structure

### Pages (`src/pages`)
- `home.jsx` — homepage with the featured trip, recommended trips, and tags
- `searchresults.jsx` — explore, search, filter, and sort trips (`/results`)
- `itinerarydetail.jsx` — a single trip with its map, day plan, and reviews
- `createitinerary.jsx` — create and edit trips
- `myitineraries.jsx` — your trips, with edit, share, and delete
- `favorites.jsx` — trips you've favorited
- `profile.jsx` — your profile and the people you follow
- `userprofile.jsx` — a traveler's public profile
- `tagsindex.jsx` — all tags (`/tags`)
- `tagpage.jsx` — trips with one tag (`/tags/<name>`)

### Components (`src/components`)
- `navbar.jsx` — top navigation
- `tabbar.jsx` — bottom tabs on phones
- `footer.jsx` — site footer
- `herocarousel.jsx` — homepage hero photo, which can also work as a slider
- `itinerarycard.jsx` — trip card
- `tripmap.jsx` — trip map
- `photogallery.jsx` — day photos with a full-screen viewer
- `dayphotoseditor.jsx`, `dayplaceseditor.jsx` — add photos and places to a day
- `imageupload.jsx` — photo upload
- `tagpicker.jsx`, `taglinks.jsx` — choose tags and link to tag pages

### Context (`src/context`)
- `AuthContext.jsx` — Google sign-in state
- `ItineraryContext.jsx` — your trips and favorites

### Styling
All styles are in `src/App.css`. Colors are CSS variables at the top of that file, including the dark mode values.

### Homepage hero
`src/constants/featured.js` controls which trip the homepage features:
- `FEATURED_TRIP_ID` — the trip to show. Leave it empty to use the highest-rated trip.
- `HERO_TRIP_COUNT` — how many top-rated trips to show when no trip is set. More than 1 turns the hero into a slider.

## Admin Features
- Delete any trip or review
- Moderate user-generated content
- Admin indicator on the user's profile

Admins are listed in `backend/config/admins.js` and `src/context/AuthContext.jsx`. Keep the two lists in sync.

## Database

MongoDB Atlas stores:

- Trips, with their day-by-day schedules, photos, and places
- Public/private settings
- Ratings and reviews
- Favorites and copy counts
- User profiles
- Who follows whom

The backend is built with Express.js and Mongoose.

## Use of Generative AI
- Examples include:
- Debugging React and Express error
- Troubleshooting MongoDB and API integration issues
- Refining UI design ideas and styling suggestions
- Giving us boilerplate templates for implementation

Our group used generative AI as a development aid throughout the project.

## How to Run

### Frontend
1. Install dependencies: `npm install`
2. Start the frontend: `npm run dev`
3. Open [http://localhost:5173](http://localhost:5173) in your browser

By default, the frontend uses the live backend, so real trips appear and anything you do while signed in changes real data. Use port 5173, because the backend only accepts requests from approved addresses.

To use your local backend instead, run:

```
VITE_API_URL=http://localhost:5001/api npm run dev
```

Photo uploads need these values in a `.env` file in the project root. Without them, the forms let you paste an image link instead.

```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Backend
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Copy `backend/.env.example` to `backend/.env` and fill in the values. `MONGO_URI` is required.
4. Start the server: `npm start`

Backend runs on: `http://localhost:5001`

To add map coordinates to existing trips that don't have them, run `node scripts/geocode-missing.js` from the `backend` folder.

### Test on a Phone
1. Connect your phone to the same Wi-Fi as your computer.
2. Run `npm run dev:phone`.
3. Open the **Network** address it prints on your phone.

This sends requests to the live backend through your computer, so trips load. Google sign-in probably won't work at this address, and a full install needs an `https` site, so test those on the deployed site.

## How to Deploy

The frontend deploys to Vercel and the backend to Render.

1. Check that everything builds: `npm run lint` and `npm run build`
2. **Vercel:** set `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`, and `VITE_API_URL` if your backend isn't at the default address. `vercel.json` already sends all page addresses to the app.
3. **Render:** set `MONGO_URI`, `FIREBASE_PROJECT_ID`, and `FRONTEND_URL`, which is your frontend's web address.
4. **Firebase:** add your frontend's web address to the authorized domains so Google sign-in works.

## Install the App
Open the deployed site on your phone:
- **iPhone:** in Safari, tap Share, then Add to Home Screen.
- **Android:** in Chrome, open the ⋮ menu, then choose Install app or Add to Home screen.
