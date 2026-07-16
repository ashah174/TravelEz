const ADMIN_EMAILS = [
  "akankshdivyananda@gmail.com",
  "ashah174@ucr.edu",
  "sraju007@ucr.edu",
  "saachi.raju@gmail.com",
  "saachiraju@gmail.com",
];

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email);
}

module.exports = { ADMIN_EMAILS, isAdminEmail };
