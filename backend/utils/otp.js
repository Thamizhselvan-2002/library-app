const crypto = require("crypto");

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTP() {
  // Use crypto for secure random number
  const buffer = crypto.randomBytes(3);
  const num = (buffer.readUIntBE(0, 3) % 900000) + 100000; // always 6 digits: 100000–999999
  return String(num);
}

/**
 * OTP expiry: 10 minutes from now
 */
function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if an OTP is expired
 */
function isExpired(expiryDate) {
  return !expiryDate || new Date() > new Date(expiryDate);
}

module.exports = { generateOTP, otpExpiry, isExpired };
