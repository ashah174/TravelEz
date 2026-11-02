const User = require("../models/User");

function toPlain(doc) {
  return typeof doc?.toObject === "function" ? doc.toObject() : doc;
}

// Adds a public `author` ({ uid, name, image }) to each itinerary, looked up
// from the User collection. Accepts mongoose documents or plain objects.
async function attachAuthors(itineraries) {
  const list = itineraries.map(toPlain);
  const uids = [...new Set(list.map((trip) => trip.ownerUid).filter(Boolean))];

  const users = uids.length
    ? await User.find({ uid: { $in: uids } }, "uid name image").lean()
    : [];
  const byUid = new Map(users.map((user) => [user.uid, user]));

  return list.map((trip) => {
    const user = byUid.get(trip.ownerUid);
    return {
      ...trip,
      author: {
        uid: trip.ownerUid,
        name: user?.name || null,
        image: user?.image || null,
      },
    };
  });
}

async function attachAuthor(itinerary) {
  const [withAuthor] = await attachAuthors([itinerary]);
  return withAuthor;
}

module.exports = { attachAuthors, attachAuthor };
