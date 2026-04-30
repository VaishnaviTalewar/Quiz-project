import { clerkMiddleware, getAuth } from "@clerk/express";
import { User } from "../models/userModel.js";

// Clerk protect middleware
export const protect = clerkMiddleware();

// Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "You are not an admin",
      });
    }

    next();
  } catch (error) {
    console.error("isAdmin error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};