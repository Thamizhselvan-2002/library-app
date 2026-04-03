const express = require("express");
const Transaction = require("../models/Transaction");
const Book = require("../models/Book");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/transactions — admin: all, student: own
router.get("/", auth, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { user: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const txs = await Transaction.find(query)
      .populate("user", "name email phone studentId")
      .populate("book", "title author genre isbn")
      .sort("-createdAt");

    // Auto-flag overdue
    const finePerDay = parseInt(process.env.FINE_PER_DAY || 5);
    const now = new Date();
    const enriched = txs.map((tx) => {
      const obj = tx.toObject();
      if (obj.status === "active" && obj.dueDate && now > new Date(obj.dueDate)) {
        const days = Math.ceil((now - new Date(obj.dueDate)) / (1000 * 60 * 60 * 24));
        obj.isOverdue = true;
        obj.overdueDays = days;
        obj.currentFine = days * finePerDay;
      } else {
        obj.isOverdue = false;
        obj.overdueDays = 0;
        obj.currentFine = obj.fineAmount || 0;
      }
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// POST /api/transactions/borrow
router.post("/borrow", auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) return res.status(404).json({ message: "Book not found" });
    if (book.availableCopies <= 0) return res.status(400).json({ message: "No copies available" });

    // Check if already borrowed
    const existing = await Transaction.findOne({
      user: req.user._id, book: bookId, type: "borrow", status: { $in: ["active", "overdue"] },
    });
    if (existing) return res.status(400).json({ message: "You already have this book borrowed" });

    // Check for unpaid fines (optional policy: block if fine > 0)
    const userFine = req.user.totalFine - req.user.finePaid;
    if (userFine > 0) {
      return res.status(400).json({ message: `You have an outstanding fine of ₹${userFine}. Please clear it before borrowing.` });
    }

    book.availableCopies -= 1;
    await book.save();

    const tx = await Transaction.create({
      user: req.user._id,
      book: bookId,
      type: "borrow",
      status: "active",
    });

    await tx.populate("book", "title author genre isbn");
    await tx.populate("user", "name email phone");
    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to borrow book" });
  }
});

// POST /api/transactions/reserve
router.post("/reserve", auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) return res.status(404).json({ message: "Book not found" });

    const existing = await Transaction.findOne({
      user: req.user._id, book: bookId, type: "reserve", status: "reserved",
    });
    if (existing) return res.status(400).json({ message: "Already reserved" });

    const tx = await Transaction.create({
      user: req.user._id,
      book: bookId,
      type: "reserve",
      status: "reserved",
    });

    await tx.populate("book", "title author genre isbn");
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: "Failed to reserve book" });
  }
});

// PUT /api/transactions/:id/return
router.put("/:id/return", auth, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate("book").populate("user");
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Allow owner or admin
    if (tx.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (tx.status === "returned") return res.status(400).json({ message: "Already returned" });

    const now = new Date();
    const finePerDay = parseInt(process.env.FINE_PER_DAY || 5);
    let fine = 0;

    if (tx.dueDate && now > new Date(tx.dueDate)) {
      const days = Math.ceil((now - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24));
      fine = days * finePerDay;
    }

    tx.status = "returned";
    tx.returnDate = now;
    tx.fineAmount = fine;
    await tx.save();

    // Return copy to book
    await Book.findByIdAndUpdate(tx.book._id, { $inc: { availableCopies: 1 } });

    // Update user fine
    if (fine > 0) {
      await User.findByIdAndUpdate(tx.user._id, { $inc: { totalFine: fine } });
    }

    res.json({ ...tx.toObject(), fineAmount: fine });
  } catch (err) {
    res.status(500).json({ message: "Failed to return book" });
  }
});

// PUT /api/transactions/:id/cancel-reserve
router.put("/:id/cancel-reserve", auth, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    tx.status = "cancelled";
    await tx.save();
    res.json({ message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
});

// PUT /api/transactions/:id/pay-fine — admin marks fine as paid
router.put("/:id/pay-fine", auth, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate("user");
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    tx.finePaid = true;
    await tx.save();

    await User.findByIdAndUpdate(tx.user._id, { $inc: { finePaid: tx.fineAmount } });

    res.json({ message: "Fine marked as paid" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update fine" });
  }
});

module.exports = router;
