import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { connectDb } from "./config/db.js";
import userRoute from "./routes/userRoute.js";
import adminRoute from "./routes/adminRoute.js";
import resultRoute from "./routes/resultRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// middleware
app.use(clerkMiddleware());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://quiz-project-git-main-vaishnavi-talewars-projects.vercel.app",
    "https://quiz-project-zx4w.vercel.app",
    "https://quiz-project-ivory-iota.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// mongodb
connectDb();

// routes
app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/result", resultRoute);

app.get("/", (req, res) => {
  res.send("Api working");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});