import express from 'express';
import { deleteQuiz, uploadQuiz, getAllQuizzes } from '../controllers/adminController.js';
import { getStats } from './../controllers/userController.js';
import { isAdmin } from '../middleware/auth.js';
import { protect } from './../middleware/auth.js';

const router = express.Router();

router.post("/upload-quiz", protect, isAdmin, uploadQuiz);

router.get("/stats", protect, isAdmin, getStats);

router.get("/quizzes", protect, isAdmin, getAllQuizzes);

router.delete("/quiz/:id", protect, isAdmin, deleteQuiz);
export default router;