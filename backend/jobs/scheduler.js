const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Book = require("../models/Book");
const { sendDueReminder, sendFineNotification } = require("../utils/notifications");

// Send reminders for books due tomorrow
async function runDailyReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    const dueSoon = await Transaction.find({
      status: "active",
      type: "borrow",
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      reminderSent: false,
    }).populate("user book");

    console.log(`📬 Found ${dueSoon.length} reminders to send`);

    for (const tx of dueSoon) {
      if (!tx.user || !tx.book) continue;
      await sendDueReminder(tx.user, tx.book, tx.dueDate);
      tx.reminderSent = true;
      await tx.save();
    }
  } catch (err) {
    console.error("Reminder job error:", err.message);
  }
}

// Check overdue, update fines, notify
async function runFineChecker() {
  try {
    const now = new Date();

    const overdue = await Transaction.find({
      status: { $in: ["active", "overdue"] },
      type: "borrow",
      dueDate: { $lt: now },
      returnDate: null,
    }).populate("user book");

    console.log(`💸 Found ${overdue.length} overdue transactions`);

    const finePerDay = parseInt(process.env.FINE_PER_DAY || 5);

    for (const tx of overdue) {
      if (!tx.user || !tx.book) continue;

      const overdueDays = Math.ceil((now - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24));
      const fine = overdueDays * finePerDay;

      tx.status = "overdue";
      tx.fineAmount = fine;
      await tx.save();

      // Update user's total fine
      await User.findByIdAndUpdate(tx.user._id, { totalFine: fine });

      // Send fine notification (once per day if not sent, or re-notify each day)
      await sendFineNotification(tx.user, tx.book, fine, overdueDays);
    }
  } catch (err) {
    console.error("Fine checker error:", err.message);
  }
}

module.exports = { runDailyReminders, runFineChecker };
