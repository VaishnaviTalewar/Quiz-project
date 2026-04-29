import express from "express";

import { clerkWehbook } from "../controllers/webhook.js";

const router = express.Router();

router.post(
  "/webhook/clerk",
  express.raw({ type: "application/json" }),
  clerkWehbook
);

export default router;