const express = require("express");
const { getMyLoyalty, earn, redeem } = require("../controllers/loyaltyController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, getMyLoyalty);
router.post("/earn", protect, authorize("admin"), earn);
router.post("/redeem", protect, redeem);

module.exports = router;
