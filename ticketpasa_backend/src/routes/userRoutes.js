const express = require("express");
const {
  getProfile,
  updateProfile,
  getUsers,
  updateUserRole,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.get("/", protect, authorize("admin"), getUsers);
router.put("/:id", protect, authorize("admin"), updateUserRole);

module.exports = router;
