# TravelEz

TravelEz is a travel itinerary sharing platform that allows users to create, organize, and share travel plans. Users can build detailed day-by-day itineraries, upload cover images, save favorite trips, browse public itineraries from other users, and leave ratings and comments.

## Tools Used
- **React** — frontend UI and component structure
- **Vite** — local dev server and build tool (runs on Node.js)
- **React Router** — client-side page navigation
- **Firebase** — Google Authentication for user login
- **Node.js / npm** — package management and running scripts
- **Express.js** — backend API development
- **MongoDB Atlas** — cloud database for storing itineraries, ratings, and comments
- **Mongoose** — MongoDB schema and data modeling

## Pages
- `home.jsx` — landing page with featured itineraries
- `searchresults.jsx` — browse and filter itineraries
- `finditinerary.jsx` — find a specific itinerary
- `itinerarydetail.jsx` — view a single itinerary, ratings, and comments
- `createitinerary.jsx` — create and edit itineraries
- `myitineraries.jsx` — view, edit, delete, and share your own itineraries
- `publicitineraries.jsx` — browse public itineraries shared by users
- `favorites.jsx` — saved/favorited itineraries
- `profile.jsx` — user profile (connected to Google account)

## Components
- `navbar.jsx` — top navigation with login/logout
- `itinerarycard.jsx` — reusable card for displaying an itinerary
- `searchbar.jsx` — search input component

## Context
- `AuthContext.jsx` — manages Google sign-in state across the app
- `ItineraryContext.jsx` — manages itineraries, favorites, public/private status, and shared application state

## What Works
Users can:

- Sign in using Google Authentication
- Create itineraries
- Edit itineraries
- Delete itineraries
- Upload itinerary cover images
- Create day-by-day travel schedules
- Share itineraries publicly or keep them private
- Browse public itineraries
- Favorite itineraries
- View itinerary details
- Leave ratings and comments
- Edit reviews
- Delete reviews

All itinerary data, ratings, comments, and public/private settings are stored in MongoDB through a custom Express API.

## Admin Features
- Access to administrator-only functionality
- Enhanced management of itineraries and application content, including the ability to delete
itineraries and comments when necessary
- Moderation of user-generated content
- Visual admin account indicator within the user profile

## Database

TravelEz uses MongoDB Atlas to store:

- Itineraries
- Day-by-day schedules
- Public/private itinerary settings
- Ratings and reviews

The backend is built with Express.js and Mongoose and provides CRUD functionality for itineraries and comments.

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

### Backend
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `npm start`
Backend runs on: `http://localhost:5001`

## How to Deploy
1. Build the app: `npm run build`

## Team Member Contributions

Anokhee Shah
- Connected frontend functionality with backend API endpoints
- Connected MongoDB Atlas database
- Assisted with database integration, debugging, and testing
- Implemented itinerary ratings, comments, and profile features

Saachi Raju
- Frontend design and UI implementation
- Developed and styled React pages and components
- Implemented itinerary creation, editing, deletion, favorites
- Assisted with integration and testing

Akanksh Divyananda
- Authentication and application integration
- Implemented Firebase Google Authentication
- Assisted with backend integration and data management
- Developed admin functionality and admin account features
