import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
const  { Schema, model, models } = mongoose;
import type { Model } from "mongoose";
import { verifyToken, type AuthenticatedRequest } from "../middleware/verifyToken.js";

const router = Router();

const categories = ["Fiction", "Science", "History", "Kids", "Others"] as const;

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, enum: categories, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    createdByName: { type: String, required: true },
    createdByEmail: { type: String, required: true },
    totalCopies: { type: Number, required: true, min: 1 },
    availableCopies: { type: Number, required: true, min: 0 },
    addedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Book: Model<any> =
  (models.Book as Model<any>) || model<any>("Book", bookSchema);

// GET: All Books
router.get("/", async (_req: Request, res: Response) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// GET: Single Book
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch book" });
  }
});

// POST: Add Book
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).authUser;

    if (!user?.email) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    const copies = Number(totalCopies);

    if (
      !title?.trim() ||
      !author?.trim() ||
      !categories.includes(category) ||
      !image?.trim() ||
      !description?.trim() ||
      !Number.isInteger(copies) ||
      copies < 1
    ) {
      res.status(400).json({ message: "Please provide valid book information" });
      return;
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category,
      image,
      description,
      createdByName: user.name || user.email,
      createdByEmail: user.email,
      totalCopies: copies,
      availableCopies: copies,
      addedDate: new Date(),
    });

    res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add book" });
  }
});

// PATCH: Update Book
router.patch("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).authUser;
    const id = String(req.params.id);

    if (!user?.email) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    if (book.createdByEmail !== user.email) {
      res.status(403).json({ message: "You cannot edit this book" });
      return;
    }

    const { title, author, category, image, description, totalCopies } = req.body;

    if (category !== undefined && !categories.includes(category)) {
      res.status(400).json({ message: "Invalid category" });
      return;
    }

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);
      const borrowedCopies = book.totalCopies - book.availableCopies;

      if (!Number.isInteger(copies) || copies < borrowedCopies || copies < 1) {
        res.status(400).json({
          message: "Total copies cannot be less than borrowed copies",
        });
        return;
      }

      book.availableCopies = copies - borrowedCopies;
      book.totalCopies = copies;
    }

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (image !== undefined) book.image = image;
    if (description !== undefined) book.description = description;

    await book.save();

    res.status(200).json({
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE: Delete Book
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).authUser;
    const id = String(req.params.id);

    if (!user?.email) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid book ID" });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({ message: "Book not found" });
      return;
    }

    if (book.createdByEmail !== user.email) {
      res.status(403).json({ message: "You cannot delete this book" });
      return;
    }

    if (book.availableCopies !== book.totalCopies) {
      res.status(400).json({
        message: "Return all borrowed copies before deleting this book",
      });
      return;
    }

    await book.deleteOne();

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

export default router;