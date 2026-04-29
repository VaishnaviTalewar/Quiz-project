import Quiz from "../models/quizModel.js";
import {User} from "../models/userModel.js";

const LETTERS = ["A", "B", "C", "D"];

// CREATE & UPDATE QUIZ
export const uploadQuiz = async (req, res) => {
  try {
    const { technology, level, timeLimit, questions } = req.body;
    const createdBy = req.auth?.userId;

    const quiz = await Quiz.findOneAndUpdate(
      {
        technology: technology.toLowerCase(),
        level,
      },
      {
        technology: technology.toLowerCase(),
        level,
        timeLimit,
        questions,
        totalQuestions: questions.length,
        createdBy,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.json({ success: true, quiz });

  } catch (error) {
  console.error("Upload Quiz error:", error);
  res.status(500).json({ message: "Internal Server Error" });
}
};


// GET ALL QUIZZES
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    return res.json(quizzes);
  } catch (error) {
    console.log("Get Quiz Error:", error);
    return res.status(500).json({ success: false });
  }
};


// DELETE QUIZ
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found...😩" });
    }

    return res.json({
      success: true,
      message: "Quiz deleted successfully...👍",
    });

  } catch (error) {
    console.log("Delete Quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting quiz",
    });
  }
};