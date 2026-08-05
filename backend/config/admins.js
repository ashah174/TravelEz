const ADMIN_EMAILS = [
  "akankshdivyananda@gmail.com",
  "ashah174@ucr.edu",
  "sraju007@ucr.edu",
  "saachi.raju@gmail.com",
  "saachiraju@gmail.com",
];

// Firebase UIDs for the same admins, used as a fallback identity check for
// accounts whose Google sign-in doesn't produce an email claim.
const ADMIN_UIDS = [
  "mNZ6TLxsCVXJsZ7hAqhKavsPmxt1", // ashah174@ucr.edu
];

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email);
}

function isAdminUser(user) {
  if (!user) return false;
  return isAdminEmail(user.email) || (!!user.uid && ADMIN_UIDS.includes(user.uid));
}

module.exports = { ADMIN_EMAILS, ADMIN_UIDS, isAdminEmail, isAdminUser };
