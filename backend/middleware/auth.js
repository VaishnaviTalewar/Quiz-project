import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { User } from "../models/userModel.js";

// 🔐 Protect middleware (checks if user is logged in)
export const protect = ClerkExpressRequireAuth();

// 🛡️ Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    // ✅ Safe access (prevents crash)
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({
        message: "Unauthorized. No userId found.",
      });
    }

    // 🔍 Find user in DB
    const user = await User.findOne({ clerkId });

    // ❗ If user not in DB
    if (!user) {
      return res.status(404).json({
        message: "User not found in database",
      });
    }

    // ❗ If not admin
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    // ✅ All good
    next();

  } catch (error) {
    // 🔥 IMPORTANT: show real error
    console.error("isAdmin middleware error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};