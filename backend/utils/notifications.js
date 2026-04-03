// Notifications for due reminders and fines — email only (no Twilio)
const { sendMail, dueReminderTemplate, fineNoticeTemplate } = require("./mailer");

async function sendDueReminder(user, book, dueDate) {
  const ds = new Date(dueDate).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  await sendMail(
    user.email,
    `📚 Reminder: "${book.title}" is due tomorrow`,
    dueReminderTemplate(user.name, book.title, book.author, book.isbn, ds)
  );
}

async function sendFineNotification(user, book, fineAmount, overdueDays) {
  await sendMail(
    user.email,
    `⚠️ Overdue Fine: ₹${fineAmount} for "${book.title}"`,
    fineNoticeTemplate(user.name, book.title, overdueDays, fineAmount)
  );
}

module.exports = { sendDueReminder, sendFineNotification };
