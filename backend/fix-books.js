/**
 * LIBRARIA — Fix Books Migration
 * ─────────────────────────────────────────────
 * Run this if you already added books directly to MongoDB
 * and they're not showing on the website.
 *
 * This sets isActive:true + fixes missing availableCopies on all books.
 *
 * Usage:
 *   cd library-app/backend
 *   node fix-books.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");

async function fix() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected:", mongoose.connection.name);

  // 1. Fix all books where isActive is not explicitly true
  const fixActive = await Book.updateMany(
    { $or: [{ isActive: { $exists: false } }, { isActive: null }, { isActive: false }] },
    { $set: { isActive: true } }
  );
  console.log(`🔧 Fixed isActive on ${fixActive.modifiedCount} book(s)`);

  // 2. Fix books where availableCopies is missing
  const booksNoAvail = await Book.find({ availableCopies: { $exists: false } });
  for (const b of booksNoAvail) {
    b.availableCopies = b.totalCopies || 1;
    await b.save({ validateBeforeSave: false });
    console.log(`🔧 Fixed availableCopies for: ${b.title}`);
  }

  // 3. Show summary
  const total = await Book.countDocuments({ isActive: true });
  const allBooks = await Book.find({ isActive: true }, "title author genre availableCopies totalCopies");
  
  console.log("\n─────────────────────────────────────────");
  console.log(`📚 Total active books in DB: ${total}`);
  console.log("─────────────────────────────────────────");
  allBooks.forEach(b => console.log(`  • ${b.title} by ${b.author} [${b.availableCopies}/${b.totalCopies} copies]`));
  console.log("─────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

fix().catch(err => {
  console.error("❌ Fix failed:", err.message);
  process.exit(1);
});
