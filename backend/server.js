import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { connectDb } from "./config/db.js";
import userRoute from "./routes/userRoute.js";
import adminRoute from "./routes/adminRoute.js";
import resultRoute from "./routes/resultRoute.js"

dotenv.config();

const app = express();
const PORT = 8080;

// middleware
app.use(clerkMiddleware());
app.use(cors());
app.use(express.json());
app.use("/api/user", userRoute)


// mongodb
connectDb();

// routes
app.use("/api/admin", adminRoute)
app.use("/api/result", resultRoute)

app.get("/", (req, res) => {
    res.send("Api working");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});