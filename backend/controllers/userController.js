import { User } from "../models/userModel.js";
import { getAuth } from "@clerk/express";

// get stats of a user
export const getStats = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalUsers = await User.countDocuments();

    const loggedInUser = await User.countDocuments({
      isLoggedIn: true,
    });

    res.json({
      totalUsers,
      loggedInUser,
      loggedInPercentage: totalUsers
        ? ((loggedInUser / totalUsers) * 100).toFixed(2)
        : "0.00",
    });
  } catch (error) {
    console.log("Admin Stats error");
    res.status(500).json({ message: "Internal Server Error" });
  }
};