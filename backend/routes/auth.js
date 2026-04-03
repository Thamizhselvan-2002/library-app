const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { generateOTP, otpExpiry, isExpired } = require("../utils/otp");
const { sendMail, registrationOTPTemplate, loginOTPTemplate } = require("../utils/mailer");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_change_me", { expiresIn: "7d" });

// ─────────────────────────────────────────────
// STEP 1: Send registration OTP
// POST /api/auth/register/send-otp
// Validates all form data, checks email not taken, then sends OTP
// ─────────────────────────────────────────────
router.post("/register/send-otp", async (req, res) => {
  try {
    const { name, email, phone, password, role, studentId, adminSecret } = req.body;

    // ── Validate required fields ──
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone, and password are required" });
    }

    // ── Validate email format ──
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // ── Validate phone ──
    const phoneClean = phone.replace(/\s/g, "");
    if (!/^\d{10}$/.test(phoneClean)) {
      return res.status(400).json({ message: "Phone must be a 10-digit number" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // ── Validate admin secret ──
    const targetRole = role === "admin" ? "admin" : "student";
    if (targetRole === "admin") {
      const secret = process.env.ADMIN_SECRET || "ADMIN2024";
      if (adminSecret !== secret) {
        return res.status(403).json({ message: "Invalid admin secret code" });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Check if email already registered and verified ──
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.isEmailVerified) {
      return res.status(409).json({ message: "Email already registered. Please login instead." });
    }

    // ── Rate limit: don't spam OTPs (max 1 per 60 seconds) ──
    if (existing && existing.emailOtpExpiry) {
      const secondsLeft = Math.ceil((new Date(existing.emailOtpExpiry) - Date.now()) / 1000);
      if (secondsLeft > 540) { // if expiry > 9 min left, OTP was sent < 60 seconds ago
        return res.status(429).json({ message: `OTP already sent. Please wait a moment before resending.` });
      }
    }

    // ── Generate OTP ──
    const otp = generateOTP();
    const expiry = otpExpiry(10); // 10 minutes

    // ── Save or update pending user ──
    let pendingUser;
    if (existing) {
      // Update existing unverified record
      existing.name = name.trim();
      existing.phone = phoneClean;
      existing.password = password; // will be re-hashed by pre-save hook
      existing.role = targetRole;
      existing.studentId = studentId ? studentId.trim() : "";
      existing.emailOtp = otp;
      existing.emailOtpExpiry = expiry;
      existing.emailOtpAttempts = 0;
      pendingUser = await existing.save();
    } else {
      pendingUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phoneClean,
        password,
        role: targetRole,
        studentId: studentId ? studentId.trim() : "",
        isEmailVerified: false,
        emailOtp: otp,
        emailOtpExpiry: expiry,
        emailOtpAttempts: 0,
      });
    }

    // ── Send OTP email ──
    await sendMail(
      normalizedEmail,
      "📚 Libraria — Verify your email",
      registrationOTPTemplate(name.trim(), otp)
    );

    console.log(`📧 Registration OTP sent to ${normalizedEmail}`);
    res.status(200).json({
      message: `OTP sent to ${normalizedEmail}. Check your inbox (and spam folder).`,
      email: normalizedEmail,
      expiresIn: 600, // seconds
    });
  } catch (err) {
    console.error("❌ send-otp error:", err.message);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: `Failed to send OTP: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// STEP 2: Verify registration OTP & complete registration
// POST /api/auth/register/verify-otp
// ─────────────────────────────────────────────
router.post("/register/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No registration found for this email. Please start over." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    // ── Check attempts (max 5) ──
    if (user.emailOtpAttempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new OTP." });
    }

    // ── Check expiry ──
    if (isExpired(user.emailOtpExpiry)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // ── Check OTP match ──
    if (user.emailOtp !== otp.trim()) {
      user.emailOtpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.emailOtpAttempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // ── OTP correct — verify email ──
    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.emailOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Email verified for ${user.email}`);
    const token = signToken(user._id);
    res.status(200).json({
      message: "Email verified! Registration complete.",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("❌ verify-otp error:", err.message);
    res.status(500).json({ message: `Verification failed: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// STEP 3: Resend registration OTP
// POST /api/auth/register/resend-otp
// ─────────────────────────────────────────────
router.post("/register/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "No registration found. Please start over." });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email already verified. Please login." });

    const otp = generateOTP();
    user.emailOtp = otp;
    user.emailOtpExpiry = otpExpiry(10);
    user.emailOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await sendMail(email, "📚 Libraria — New verification OTP", registrationOTPTemplate(user.name, otp));
    res.json({ message: "New OTP sent. Check your inbox.", expiresIn: 600 });
  } catch (err) {
    res.status(500).json({ message: `Failed to resend OTP: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// LOGIN STEP 1: Validate credentials → send login OTP
// POST /api/auth/login/send-otp
// ─────────────────────────────────────────────
router.post("/login/send-otp", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "No account found with this email" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    if (!user.isEmailVerified) {
      // Re-send registration OTP instead of login OTP
      const otp = generateOTP();
      user.emailOtp = otp;
      user.emailOtpExpiry = otpExpiry(10);
      user.emailOtpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      await sendMail(user.email, "📚 Libraria — Verify your email to login", registrationOTPTemplate(user.name, otp));
      return res.status(403).json({
        message: "Email not verified. A new OTP has been sent to your email.",
        needsVerification: true,
        email: user.email,
      });
    }

    // ── Generate login OTP ──
    const otp = generateOTP();
    user.loginOtp = otp;
    user.loginOtpExpiry = otpExpiry(10);
    user.loginOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await sendMail(
      user.email,
      "🔐 Libraria — Your login OTP",
      loginOTPTemplate(user.name, otp)
    );

    console.log(`🔐 Login OTP sent to ${user.email}`);
    res.json({
      message: `Login OTP sent to ${user.email}`,
      email: user.email,
      name: user.name,
      expiresIn: 600,
    });
  } catch (err) {
    console.error("❌ login send-otp error:", err.message);
    res.status(500).json({ message: `Failed to send login OTP: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// LOGIN STEP 2: Verify login OTP → issue JWT
// POST /api/auth/login/verify-otp
// ─────────────────────────────────────────────
router.post("/login/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ── Check attempts ──
    if (user.loginOtpAttempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please login again." });
    }

    // ── Check expiry ──
    if (isExpired(user.loginOtpExpiry)) {
      return res.status(400).json({ message: "OTP has expired. Please login again to get a new OTP." });
    }

    // ── Check OTP ──
    if (user.loginOtp !== otp.trim()) {
      user.loginOtpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.loginOtpAttempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // ── Login success ──
    user.loginOtp = null;
    user.loginOtpExpiry = null;
    user.loginOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Login OTP verified for ${user.email}`);
    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error("❌ login verify-otp error:", err.message);
    res.status(500).json({ message: `Login failed: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// Resend login OTP
// POST /api/auth/login/resend-otp
// ─────────────────────────────────────────────
router.post("/login/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isEmailVerified) {
      return res.status(404).json({ message: "User not found or email not verified" });
    }

    const otp = generateOTP();
    user.loginOtp = otp;
    user.loginOtpExpiry = otpExpiry(10);
    user.loginOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    await sendMail(user.email, "🔐 Libraria — New login OTP", loginOTPTemplate(user.name, otp));
    res.json({ message: "New OTP sent.", expiresIn: 600 });
  } catch (err) {
    res.status(500).json({ message: `Failed to resend OTP: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
