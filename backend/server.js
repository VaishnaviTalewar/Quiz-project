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

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://quiz-project-git-main-vaishnavi-talewars-projects.vercel.app",
  "https://quiz-project-zx4w.vercel.app",
  "https://quiz-project-ivory-iota.vercel.app",
  "https://quiz-project-qbd1.onrender.com",
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhostOrigin =
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1");
    if (allowedOrigins.includes(origin) || isLocalhostOrigin) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy does not allow access from the specified Origin."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(clerkMiddleware());
app.use(cors(corsOptions));
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