import express from "express";
import { protect } from "../middleware/auth.js";

import { CreatemyResult, getMyResult } from "../controllers/resultController.js";

const router = express.Router();

router.use(protect);
router.post("/save-result", CreatemyResult);
router.get("/my-result", getMyResult);

export default router;