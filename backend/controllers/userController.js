import { getAuth } from "@clerk/express";
import { User } from "../models/userModel.js";

export const getStats = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalUsers = await User.countDocuments();

    const loggedInUsers = await User.countDocuments({
      isLoggedIn: true,
    });

    return res.json({
      totalUsers,
      loggedInUsers,
      loggedInPercentage: totalUsers
        ? ((loggedInUsers / totalUsers) * 100).toFixed(2)
        : "0.00",
    });

  } catch (error) {
    console.log("Admin Stats error:", error);
    return res.status(500).json({ message: error.message });
  }
};