const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { isAdminEmail } = require("../config/admins");

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "travelez-9c5ba";

const client = jwksClient({
  jwksUri:
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  cache: true,
  rateLimit: true,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (error, key) => {
    if (error) return callback(error);
    callback(null, key.getPublicKey());
  });
}

function verifyIdToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ["RS256"],
        audience: FIREBASE_PROJECT_ID,
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      },
      (error, decoded) => {
        if (error) return reject(error);
        resolve(decoded);
      }
    );
  });
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const decoded = await verifyIdToken(token);

    if (!decoded.email) {
      return res.status(401).json({ message: "Token is missing an email claim" });
    }

    req.user = {
      uid: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = await verifyIdToken(token);

    req.user = decoded.email
      ? { uid: decoded.sub, email: decoded.email, name: decoded.name }
      : null;
  } catch {
    req.user = null;
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!isAdminEmail(req.user?.email)) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
