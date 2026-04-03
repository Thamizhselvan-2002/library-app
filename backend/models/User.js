const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:             { type: String, required: [true, "Name is required"], trim: true },
    email:            { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    phone:            { type: String, required: [true, "Phone is required"], trim: true },
    password:         { type: String, required: [true, "Password is required"], minlength: [6, "Password must be at least 6 characters"] },
    role:             { type: String, enum: ["student", "admin"], default: "student" },
    studentId:        { type: String, trim: true, default: "" },

    // Email verification
    isEmailVerified:  { type: Boolean, default: false },
    emailOtp:         { type: String, default: null },
    emailOtpExpiry:   { type: Date, default: null },
    emailOtpAttempts: { type: Number, default: 0 },

    // Login OTP (2FA on login)
    loginOtp:         { type: String, default: null },
    loginOtpExpiry:   { type: Date, default: null },
    loginOtpAttempts: { type: Number, default: 0 },

    totalFine:        { type: Number, default: 0 },
    finePaid:         { type: Number, default: 0 },
    isActive:         { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailOtp;
  delete obj.loginOtp;
  delete obj.emailOtpExpiry;
  delete obj.loginOtpExpiry;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
