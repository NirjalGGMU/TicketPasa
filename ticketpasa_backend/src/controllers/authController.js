const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const generateOtp = require("../utils/generateOtp");
const User = require("../models/User");
const Loyalty = require("../models/Loyalty");

const OTP_TTL_MINUTES = 10;

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password, phone });
  await Loyalty.create({ user: user._id });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
      tier: user.tier,
    },
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
      tier: user.tier,
    },
  });
});

// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way so we don't leak which emails are registered.
  if (!user) {
    return res.json({
      success: true,
      message: "If that email is registered, an OTP has been sent",
    });
  }

  const otp = generateOtp();
  user.resetOtp = await bcrypt.hash(otp, 10);
  user.resetOtpExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.resetOtpVerified = false;
  await user.save();

  // Nodemailer isn't wired up yet — log the OTP so the flow is testable locally.
  console.log(`[forgot-password] OTP for ${user.email}: ${otp}`);

  res.json({
    success: true,
    message: "If that email is registered, an OTP has been sent",
  });
});

// @route POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+resetOtp +resetOtpExpiry +resetOtpVerified"
  );

  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (user.resetOtpExpiry.getTime() < Date.now()) {
    throw new ApiError(400, "OTP has expired, please request a new one");
  }

  const isMatch = await bcrypt.compare(otp, user.resetOtp);
  if (!isMatch) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.resetOtpVerified = true;
  await user.save();

  res.json({ success: true, message: "OTP verified, you can now reset your password" });
});

// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and new password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+resetOtp +resetOtpExpiry +resetOtpVerified"
  );

  if (!user || !user.resetOtpVerified || !user.resetOtpExpiry) {
    throw new ApiError(400, "OTP verification is required before resetting the password");
  }

  if (user.resetOtpExpiry.getTime() < Date.now()) {
    throw new ApiError(400, "OTP has expired, please request a new one");
  }

  user.password = password;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  user.resetOtpVerified = false;
  await user.save();

  res.json({ success: true, message: "Password reset successfully" });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, getMe };
