const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

// @route GET /api/users/me
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route PUT /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (password) user.password = password;

  await user.save();

  res.json({
    success: true,
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

// @route GET /api/users (admin)
const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @route PUT /api/users/:id (admin) — update role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, "role must be either 'user' or 'admin'");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.role = role;
  await user.save();

  res.json({ success: true, user });
});

module.exports = { getProfile, updateProfile, getUsers, updateUserRole };
