import { User } from "../models/userModel.js";
import "dotenv/config";
import { Webhook } from "svix";

export const clerkWehbook = async (req, res) => {
  try {
    console.log("WEBHOOK HIT 🐤");

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    const payload = JSON.stringify(req.body);
    const headers = req.headers;

    const wh = new Webhook(WEBHOOK_SECRET);

    const evt = wh.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    });

    const { type, data } = evt;
    console.log("EVENT TYPE:", type);

    // ✅ USER CREATED
    if (type === "user.created") {
      const primaryEmail =
        data.email_addresses?.find(
          (e) => e.id === data.primary_email_address_id
        )?.email_address || "";

      const role =
        primaryEmail === "vaishnavitalewar8762@gmail.com"
          ? "admin"
          : "user";

      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          clerkId: data.id,
          email: primaryEmail,
          fullName: `${data.first_name || ""} ${data.last_name || ""}`,
          role,
        },
        { upsert: true, new: true }
      );
    }
    // LOGIN
    if (type === "session.created") {
      console.log("LOGIN DETECTED");

      await User.findOneAndUpdate(
        { clerkId: data.user_id },
        { isLoggedIn: true },
        { new: true }
      );
    }

    //  LOGOUT
    if (type === "session.ended") {
      console.log("LOGOUT DETECTED");

      await User.findOneAndUpdate(
        { clerkId: data.user_id },
        { isLoggedIn: false },
        { new: true }
      );
    }

    //  DELETE
    if (type === "user.deleted") {
      console.log("USER DELETED DETECTED");

      await User.findOneAndDelete({
        clerkId: data.id,
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error in clerkWebhook:", error);
    return res.status(400).json({ success: false });
  }
};