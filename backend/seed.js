/**
 * LIBRARIA — Book Seed Script
 * ─────────────────────────────────────────────
 * Run once to add all 22 books to your MongoDB.
 *
 * Usage:
 *   cd library-app/backend
 *   node seed.js
 *
 * Safe to re-run — skips books that already exist (matched by ISBN or title+author).
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");

const BOOKS = [
  { title:"The Great Gatsby",        author:"F. Scott Fitzgerald", genre:"Fiction",    year:1925, isbn:"9780743273565",  description:"A tragic story of love, wealth, and illusion in the Jazz Age.", totalCopies:3 },
  { title:"The Kite Runner",         author:"Khaled Hosseini",     genre:"Fiction",    year:2003, isbn:"9781594631931",  description:"A story of friendship, betrayal, and redemption set in Afghanistan.", totalCopies:3 },
  { title:"Atomic Habits",           author:"James Clear",          genre:"Self-Help",  year:2018, isbn:"9780735211292",  description:"Small habits create big life changes.", totalCopies:4 },
  { title:"The Power of Now",        author:"Eckhart Tolle",        genre:"Self-Help",  year:1997, isbn:"9781577314806",  description:"A guide to living fully in the present moment.", totalCopies:3 },
  { title:"Dune",                    author:"Frank Herbert",         genre:"Sci-Fi",     year:1965, isbn:"9780441013593",  description:"Epic science fiction story set on a desert planet.", totalCopies:3 },
  { title:"The Martian",             author:"Andy Weir",             genre:"Sci-Fi",     year:2011, isbn:"9780553418026",  description:"An astronaut struggles to survive alone on Mars.", totalCopies:3 },
  { title:"Pride and Prejudice",     author:"Jane Austen",           genre:"Classic",    year:1813, isbn:"9780141439518",  description:"A romantic novel exploring manners and marriage.", totalCopies:4 },
  { title:"Moby-Dick",               author:"Herman Melville",       genre:"Classic",    year:1851, isbn:"9781503280786",  description:"A sailor's narrative of the obsessive quest for a white whale.", totalCopies:3 },
  { title:"Sapiens",                 author:"Yuval Noah Harari",     genre:"History",    year:2011, isbn:"9780062316097",  description:"A brief history of humankind from evolution to modern times.", totalCopies:4 },
  { title:"Guns, Germs, and Steel",  author:"Jared Diamond",         genre:"History",    year:1997, isbn:"9780393317558",  description:"Explains why civilizations developed differently.", totalCopies:3 },
  { title:"A Brief History of Time", author:"Stephen Hawking",       genre:"Science",    year:1988, isbn:"9780553380163",  description:"An overview of cosmology and the universe.", totalCopies:3 },
  { title:"Cosmos",                  author:"Carl Sagan",            genre:"Science",    year:1980, isbn:"9780345539434",  description:"Explores the universe and humanity's place in it.", totalCopies:3 },
  { title:"Clean Code",              author:"Robert C. Martin",      genre:"Technology", year:2008, isbn:"9780132350884",  description:"A handbook of agile software craftsmanship.", totalCopies:4 },
  { title:"The Pragmatic Programmer",author:"Andrew Hunt",           genre:"Technology", year:1999, isbn:"9780201616224",  description:"Tips and practices for effective programming.", totalCopies:4 },
  { title:"Wings of Fire",           author:"A.P.J. Abdul Kalam",    genre:"Biography",  year:1999, isbn:"9788173711466",  description:"Autobiography of India's former president and scientist.", totalCopies:4 },
  { title:"Steve Jobs",              author:"Walter Isaacson",       genre:"Biography",  year:2011, isbn:"9781451648539",  description:"The life story of Apple co-founder Steve Jobs.", totalCopies:3 },
  { title:"Gone Girl",               author:"Gillian Flynn",          genre:"Mystery",    year:2012, isbn:"9780307588371",  description:"A thriller about a missing wife and hidden secrets.", totalCopies:3 },
  { title:"The Da Vinci Code",       author:"Dan Brown",             genre:"Mystery",    year:2003, isbn:"9780307474278",  description:"A symbologist uncovers hidden religious secrets.", totalCopies:4 },
  { title:"The Notebook",            author:"Nicholas Sparks",       genre:"Romance",    year:1996, isbn:"9780446605236",  description:"A timeless love story of passion and memory.", totalCopies:3 },
  { title:"Me Before You",           author:"Jojo Moyes",            genre:"Romance",    year:2012, isbn:"9780143124542",  description:"A love story that changes two lives forever.", totalCopies:3 },
  { title:"Meditations",             author:"Marcus Aurelius",        genre:"Philosophy", year:180,  isbn:"9780140449334",  description:"Personal writings on Stoic philosophy.", totalCopies:3 },
  { title:"The Republic",            author:"Plato",                  genre:"Philosophy", year:-380, isbn:"9780140455113",  description:"A discussion on justice and the ideal state.", totalCopies:3 },
];

async function seed() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to:", mongoose.connection.name);

  let inserted = 0, skipped = 0;

  for (const b of BOOKS) {
    // Check for existing by ISBN first, then by title+author
    const existing = await Book.findOne({
      $or: [
        { isbn: b.isbn },
        {
          title: { $regex: `^${b.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
          author: { $regex: `^${b.author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        },
      ],
    });

    if (existing) {
      // If it exists but isActive is missing/false, fix it
      if (existing.isActive !== true) {
        await Book.findByIdAndUpdate(existing._id, { isActive: true });
        console.log(`  🔧 Fixed isActive for: ${b.title}`);
      } else {
        console.log(`  ⏭  Skipped (exists):  ${b.title}`);
      }
      skipped++;
      continue;
    }

    await Book.create({
      ...b,
      availableCopies: b.totalCopies,
      isActive: true,
    });

    console.log(`  ✅ Inserted: ${b.title}`);
    inserted++;
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`📚 Done!  ${inserted} inserted  |  ${skipped} skipped`);
  console.log("─────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
