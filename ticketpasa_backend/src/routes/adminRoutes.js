const express = require("express");
const { getDashboard, getAnalytics, getReports } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);
router.get("/reports", getReports);

module.exports = router;
