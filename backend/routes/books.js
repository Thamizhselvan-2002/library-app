const express = require("express");
const Book = require("../models/Book");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

function activeQuery(extra = {}) {
  return {
    ...extra,
    $or: [{ isActive: true }, { isActive: { $exists: false } }, { isActive: null }],
  };
}

// ── Parse raw text/csv/json into book array
function parseBookData(content, fileType) {
  const books = [];
  const text = content.trim();

  // ── JSON ──
  if (fileType === "json" || (text.startsWith("[") || text.startsWith("{"))) {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map(normalizeBook).filter(Boolean);
    } catch { /* fall through to text parsing */ }
  }

  // ── CSV ──
  if (fileType === "csv" || text.includes(",")) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
      const b = normalizeBook(obj);
      if (b) books.push(b);
    }
    return books;
  }

  // ── Plain text (one book per line or key:value blocks) ──
  // Try key:value format first
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const obj = {};
    block.split("\n").forEach(line => {
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (m) obj[m[1].trim().toLowerCase().replace(/\s+/g, "")] = m[2].trim();
    });
    if (obj.title || obj.name) {
      const b = normalizeBook(obj);
      if (b) books.push(b);
    }
  }
  if (books.length > 0) return books;

  // Tab-separated
  if (text.includes("\t")) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const headers = lines[0].split("\t").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split("\t");
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx]?.trim() || ""; });
      const b = normalizeBook(obj);
      if (b) books.push(b);
    }
    return books;
  }

  return books;
}

function normalizeBook(obj) {
  if (!obj) return null;
  // Map common key variations to standard fields
  const title = obj.title || obj.name || obj.bookname || obj.booktitle || "";
  const author = obj.author || obj.writer || obj.by || obj.authorname || "";
  const genre = obj.genre || obj.category || obj.type || obj.subject || "Other";
  const isbn = obj.isbn || obj.isbn13 || obj.isbn10 || obj.isbnno || "";
  const year = parseInt(obj.year || obj.publishedyear || obj.publicationyear || obj.published || 0) || undefined;
  const description = obj.description || obj.desc || obj.summary || obj.about || "";
  const totalCopies = Math.max(1, parseInt(obj.totalcopies || obj.copies || obj.quantity || obj.qty || 3) || 3);
  const coverImage = obj.coverimage || obj.cover || obj.image || obj.imageurl || obj.coverurl || "";

  if (!title.trim()) return null;

  return {
    title: title.trim(),
    author: author.trim() || "Unknown",
    genre: genre.trim(),
    isbn: isbn.toString().trim(),
    year,
    description: description.trim(),
    totalCopies,
    coverImage: coverImage.trim(),
  };
}

// GET /api/books
router.get("/", auth, async (req, res) => {
  try {
    const { search, genre } = req.query;
    const base = activeQuery();
    if (search) {
      base.$and = [{
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ],
      }];
    }
    if (genre && genre !== "All") base.genre = genre;
    const books = await Book.find(base).populate("addedBy", "name").sort("-createdAt");
    res.json(books);
  } catch (err) {
    console.error("GET /books:", err.message);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// GET /api/books/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("addedBy", "name");
    if (!book || book.isActive === false) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch book" });
  }
});

// POST /api/books — single book
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { title, author, genre, isbn, year, description, totalCopies, coverImage } = req.body;
    if (!title || !author || !genre) return res.status(400).json({ message: "Title, author, and genre are required" });
    const copies = Math.max(1, parseInt(totalCopies) || 1);
    const book = await Book.create({
      title: title.trim(), author: author.trim(), genre: genre.trim(),
      isbn: isbn?.trim() || "", year: year ? parseInt(year) : undefined,
      description: description?.trim() || "",
      coverImage: coverImage?.trim() || "",
      totalCopies: copies, availableCopies: copies,
      isActive: true, addedBy: req.user._id,
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to add book: " + err.message });
  }
});

// POST /api/books/bulk — accepts parsed books array
router.post("/bulk", auth, adminOnly, async (req, res) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: "books array is required" });
    }
    const results = { inserted: 0, skipped: 0, errors: [] };
    for (const b of books) {
      if (!b.title) { results.skipped++; continue; }
      try {
        const existing = b.isbn
          ? await Book.findOne({ isbn: b.isbn.toString() })
          : await Book.findOne({
              title: { $regex: `^${b.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
              author: { $regex: `^${(b.author||"").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            });
        if (existing) { results.skipped++; continue; }
        const copies = Math.max(1, parseInt(b.totalCopies) || 3);
        await Book.create({
          title: b.title.trim(), author: (b.author||"Unknown").trim(),
          genre: (b.genre||"Other").trim(), isbn: b.isbn ? b.isbn.toString().trim() : "",
          year: b.year ? parseInt(b.year) : undefined,
          description: b.description?.trim() || "",
          coverImage: b.coverImage?.trim() || "",
          totalCopies: copies, availableCopies: copies,
          isActive: true, addedBy: req.user._id,
        });
        results.inserted++;
      } catch (e) {
        results.errors.push(`"${b.title}": ${e.message}`);
        results.skipped++;
      }
    }
    res.status(201).json({
      message: `${results.inserted} book(s) added, ${results.skipped} skipped`,
      ...results,
    });
  } catch (err) {
    res.status(500).json({ message: "Bulk insert failed: " + err.message });
  }
});

// POST /api/books/parse-file — parse raw file content into book preview
router.post("/parse-file", auth, adminOnly, async (req, res) => {
  try {
    const { content, fileType } = req.body;
    if (!content) return res.status(400).json({ message: "content is required" });
    const books = parseBookData(content, (fileType || "").toLowerCase());
    res.json({ books, count: books.length });
  } catch (err) {
    res.status(500).json({ message: "Parse failed: " + err.message });
  }
});

// PUT /api/books/:id
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { ...req.body, isActive: req.body.isActive !== false },
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE /api/books/:id — soft delete
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove book" });
  }
});

module.exports = router;
