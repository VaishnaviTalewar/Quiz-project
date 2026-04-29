import { clerkMiddleware, getAuth } from "@clerk/express";
import { User } from "../models/userModel.js";

// ✅ Must pass request to middleware properly
export const protect = clerkMiddleware();

// Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req); // ✅ correct

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(401).json({
        message: "User not found in database",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only",
      });
    }

    next();

  } catch (error) {
    console.error("isAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};