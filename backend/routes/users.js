const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/users — admin only
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "student" }).select("-password").sort("-createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/users/:id — admin or own
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// PUT /api/users/:id/deactivate — admin only
router.put("/:id/deactivate", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate user" });
  }
});

// GET /api/users/stats/overview — admin dashboard stats
router.get("/stats/overview", auth, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", isActive: true });
    const totalActive = await Transaction.countDocuments({ status: { $in: ["active", "overdue"] }, type: "borrow" });
    const totalOverdue = await Transaction.countDocuments({ status: "overdue" });
    const totalReserved = await Transaction.countDocuments({ status: "reserved" });

    const fineResult = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: "$fineAmount" } } },
    ]);
    const totalFines = fineResult[0]?.total || 0;

    const unpaidFines = await Transaction.aggregate([
      { $match: { fineAmount: { $gt: 0 }, finePaid: false } },
      { $group: { _id: null, total: { $sum: "$fineAmount" } } },
    ]);

    res.json({
      totalStudents,
      totalActive,
      totalOverdue,
      totalReserved,
      totalFines,
      unpaidFines: unpaidFines[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
