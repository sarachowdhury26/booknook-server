import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import booksRouter from "./routes/books.js";
import borrowsRouter from "./routes/borrows.js";
import authRouter from "./routes/auth.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("BookNook API is running!");
});

app.use("/api/books", booksRouter);
app.use("/api/borrows", borrowsRouter);
app.use("/api/auth", authRouter);
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`BookNook Server running on port ${PORT}`);

  try {
    await connectDB();
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
  }
});