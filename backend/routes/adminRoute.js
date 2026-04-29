import express from 'express';
import { deleteQuiz, uploadQuiz, getAllQuizzes } from '../controllers/adminController.js';
import { getStats } from './../controllers/userController.js';
import { isAdmin } from '../middleware/auth.js';
import { protect } from './../middleware/auth.js';

const router = express.Router();

router.post("/upload-quiz", protect, isAdmin, uploadQuiz);

router.get("/stats", getStats);
router.get("/quizzes", getAllQuizzes);
router.delete("/quiz/:id", deleteQuiz);

export default router;