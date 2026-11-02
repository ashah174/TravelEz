const User = require("../models/User");

function toPlain(doc) {
  return typeof doc?.toObject === "function" ? doc.toObject() : doc;
}

// Removes private fields before an itinerary is sent to a client:
// - owner and reviewer email addresses
// - the list of user IDs who favorited it (replaced by a count)
function stripPrivateFields(trip) {
  const { ownerEmail, favoritedBy, comments, ...rest } = trip;

  return {
    ...rest,
    favoriteCount: Array.isArray(favoritedBy) ? favoritedBy.length : rest.favoriteCount || 0,
    comments: (comments || []).map(({ ownerEmail: _email, ...comment }) => comment),
  };
}

// Prepares itineraries for a response: strips private fields and adds a
// public `author` ({ uid, name, image }) looked up from the User collection.
// Accepts mongoose documents or plain objects.
async function presentItineraries(itineraries) {
  const list = itineraries.map(toPlain);
  const uids = [...new Set(list.map((trip) => trip.ownerUid).filter(Boolean))];

  const users = uids.length
    ? await User.find({ uid: { $in: uids } }, "uid name image").lean()
    : [];
  const byUid = new Map(users.map((user) => [user.uid, user]));

  return list.map((trip) => {
    const user = byUid.get(trip.ownerUid);
    return {
      ...stripPrivateFields(trip),
      author: {
        uid: trip.ownerUid,
        name: user?.name || null,
        image: user?.image || null,
      },
    };
  });
}

async function presentItinerary(itinerary) {
  const [presented] = await presentItineraries([itinerary]);
  return presented;
}

module.exports = { presentItineraries, presentItinerary };
