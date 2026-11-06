import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { Model } from "mongoose";
import { verifyToken, type AuthenticatedRequest } from "../middleware/verifyToken.js";
import { Book } from "./books.js";

const router = Router();

const borrowSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    bookTitle: { type: String, required: true },
    bookImage: { type: String, default: "" },
    borrowerName: { type: String, required: true },
    borrowerEmail: { type: String, required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Borrowed", "Returned"],
      default: "Borrowed",
    },
  },
  { timestamps: true }
);

borrowSchema.index(
  { bookId: 1, borrowerEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Borrowed" },
  }
);

const Borrow: Model<any> =
  (models.Borrow as Model<any>) || model<any>("Borrow", borrowSchema);

// GET: Borrow records
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).authUser;

    if (!user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = await Borrow.find({
      borrowerEmail: user.email,
    }).sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch records" });
  }
});

// POST: Borrow a book
router.post("/:bookId", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).authUser;
    const bookId = String(req.params.bookId);

    if (!user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const existing = await Borrow.findOne({
      bookId,
      borrowerEmail: user.email,
      status: "Borrowed",
    });

    if (existing) {
      return res.status(409).json({
        message: "You have already borrowed this book",
      });
    }

    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!book) {
      return res.status(400).json({ message: "Book unavailable" });
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const record = await Borrow.create({
        bookId: book._id,
        bookTitle: book.title,
        bookImage: book.image || "",
        borrowerName: user.name || user.email,
        borrowerEmail: user.email,
        borrowDate: new Date(),
        dueDate,
        status: "Borrowed",
      });

      return res.status(201).json({
        message: "Book borrowed successfully",
        record,
      });
    } catch (error: any) {
      await Book.updateOne(
        { _id: bookId },
        { $inc: { availableCopies: 1 } }
      );

      if (error.code === 11000) {
        return res.status(409).json({
          message: "Already borrowed",
        });
      }

      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to borrow book" });
  }
});

// PATCH: Return a book
router.patch(
  "/:borrowId/return",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).authUser;
      const borrowId = String(req.params.borrowId);

      if (!user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!mongoose.isValidObjectId(borrowId)) {
        return res.status(400).json({ message: "Invalid borrow ID" });
      }

      const record = await Borrow.findOneAndUpdate(
        {
          _id: borrowId,
          borrowerEmail: user.email,
          status: "Borrowed",
        },
        {
          $set: {
            status: "Returned",
            returnDate: new Date(),
          },
        },
        { new: true }
      );

      if (!record) {
        return res.status(404).json({
          message: "Record not found or already returned",
        });
      }

      await Book.updateOne(
        { _id: record.bookId },
        { $inc: { availableCopies: 1 } }
      );

      return res.status(200).json({
        message: "Book returned successfully",
        record,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to return book" });
    }
  }
);

export default router;