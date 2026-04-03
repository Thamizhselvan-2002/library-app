const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    type: { type: String, enum: ["borrow", "reserve"], required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    returnDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "returned", "overdue", "reserved", "cancelled"],
      default: "active",
    },
    fineAmount: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    fineNotificationSent: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-compute due date: 14 days from borrow
transactionSchema.pre("save", function (next) {
  if (this.isNew && this.type === "borrow" && !this.dueDate) {
    const due = new Date(this.borrowDate);
    due.setDate(due.getDate() + 14);
    this.dueDate = due;
  }
  next();
});

// Check if overdue
transactionSchema.methods.isOverdue = function () {
  return (
    this.status === "active" &&
    this.dueDate &&
    new Date() > new Date(this.dueDate)
  );
};

// Calculate current fine
transactionSchema.methods.calculateFine = function () {
  if (!this.isOverdue() && this.status !== "overdue") return this.fineAmount;
  const finePerDay = parseInt(process.env.FINE_PER_DAY || 5);
  const overdueDays = Math.ceil(
    (new Date() - new Date(this.dueDate)) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, overdueDays) * finePerDay;
};

module.exports = mongoose.model("Transaction", transactionSchema);
