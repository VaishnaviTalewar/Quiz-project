
import React, { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Code,
  Database,
  Coffee,
  Cpu,
  Globe,
  Layout,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Award,
  Terminal,
  Star,
  Trophy,
  Sparkles,
  Zap,
  Target,
  Menu,
  X,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  Eye,
  BarChart3,
  HelpCircle,
  PlayCircle,
  Brain,
} from "lucide-react";
import { useApi } from "../services/api.js";
import { useUser, useClerk } from "@clerk/react"
import {
  sidebarStyles,
  cssStyles,
  colorSchemes,
  getTimeColor,
  getQuestionStatusColor,
  getOptionButtonStyle,
} from "../assets/dummyStyles.js";

const STORAGE_KEY = "techQuizMasterProgress";
// Mapping of technology to icons (using lucide-react icons as placeholders; replace with actual tech icons as needed)
const techIconMap = {
  html: Code,
  css: Layout,
  javascript: Zap,
  react: Cpu,
  node: Terminal,
  mongodb: Database,
  java: Coffee,
  python: Globe,
};
// For , Basic , Intermediate , Advance icon
const levelIconMap = {
  basic: Target,
  intermediate: Zap,
  advanced: Trophy,
};
// color
const levelColorMap = {
  basic: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
  intermediate: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
  advanced: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
};
const SidebarCompo = () => {
  // Auth & User
  const { request } = useApi();
  const { isSignedIn } = useUser();
  const { openSignIn, signOut } = useClerk();
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Api call
  // Variables and state
  const [questionsData, setQuestionsData] = useState({});
  const [technologies, setTechnologies] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const timerRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);
  // handle book button
  const handleHomeClick = () => {
    // Reset all states to show the initial "Select Technology" screen
    setSelectedTech(null);
    setSelectedLevel(null);
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
    setIsQuizStarted(false);
    setReviewMode(false);

    // Stop timer if it's running
    if (isTimerRunning) {
      stopTimer();
    }
  };

  // Load saved state from localStorage (with migration support)
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Migrate old structure to new structure if needed
        if (parsed && !parsed.progressByTech) {
          if (parsed.selectedTech && parsed.selectedLevel) {
            const migrated = {
              progressByTech: {
                [parsed.selectedTech]: {
                  [parsed.selectedLevel]: {
                    currentQuestion: parsed.currentQuestion || 0,
                    userAnswers: parsed.userAnswers || {},
                    showResults: parsed.showResults || false,
                    completedQuestions: parsed.completedQuestions || [],
                    isSubmitted: parsed.isSubmitted || false,
                    reviewMode: parsed.reviewMode || false,
                    timeLeft: parsed.timeLeft || 0,
                    timerStartedAt: parsed.timerStartedAt || null,
                    elapsedTime: parsed.elapsedTime || 0,
                    isQuizStarted: parsed.isQuizStarted || false,
                  },
                },
              },
              currentTech: parsed.selectedTech,
              currentLevel: parsed.selectedLevel,
              timestamp: new Date().toISOString(),
            };
            return migrated;
          }
        }
        return parsed;
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    }
    return null;
  };

  const savedState = loadSavedState();

  // track window width for responsive behavior
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  // Selected tech & level
  const [selectedTech, setSelectedTech] = useState(
    savedState?.currentTech || null,
  );

  const [selectedLevel, setSelectedLevel] = useState(
    savedState?.currentLevel || null,
  );

  const selectedTechObj = React.useMemo(() => {
    return technologies.find((t) => t.id === selectedTech) || {};
  }, [technologies, selectedTech]);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(
    savedState?.progressByTech?.[savedState?.currentTech]?.[
      savedState?.currentLevel
    ]?.timeLeft || 0,
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(
    savedState?.progressByTech?.[savedState?.currentTech]?.[
      savedState?.currentLevel
    ]?.timerStartedAt || null,
  );
  const [elapsedTime, setElapsedTime] = useState(
    savedState?.progressByTech?.[savedState?.currentTech]?.[
      savedState?.currentLevel
    ]?.elapsedTime || 0,
  );

  // Quiz start state
  const [isQuizStarted, setIsQuizStarted] = useState(
    savedState?.progressByTech?.[savedState?.currentTech]?.[
      savedState?.currentLevel
    ]?.isQuizStarted || false,
  );

  // Helper for level
  const getLevelsForTech = (tech) => {
    if (!questionsData[tech]) return [];

    // Get all level keys for this tech
    const levelKeys = Object.keys(questionsData[tech]);

    // Map each level to an object with its details
    const levels = levelKeys.map((level) => {
      const levelData = questionsData[tech][level]; // ← this line was missing
      const LevelIcon = levelIconMap[level?.toLowerCase()] || HelpCircle;

      return {
        id: level,
        name: level.charAt(0).toUpperCase() + level.slice(1),
        questions: levelData.questions?.length || 0,
        time: levelData.timeLimit ? `${levelData.timeLimit}m` : "",
        icon: (
          <LevelIcon
            size={16}
            className={`${level === selectedLevel ? "text-indigo-600" : "text-gray-600"}`}
          />
        ),
        color: colorSchemes[tech?.toUpperCase()] || "",
      };
    });

    // Reverse so that oldest level appears first
    return levels.reverse();
  };

  // Initialize progress for current tech/level
  const getInitialProgressForTechLevel = (tech, level) => {
    if (!tech || !level)
      return {
        currentQuestion: 0,
        userAnswers: {},
        showResults: false,
        completedQuestions: [],
        isSubmitted: false,
        reviewMode: false,
        timeLeft: 0,
        timerStartedAt: null,
        elapsedTime: 0,
        isQuizStarted: false,
      };

    return (
      savedState?.progressByTech?.[tech]?.[level] || {
        currentQuestion: 0,
        userAnswers: {},
        showResults: false,
        completedQuestions: [],
        isSubmitted: false,
        reviewMode: false,
        timeLeft: 0,
        timerStartedAt: null,
        elapsedTime: 0,
        isQuizStarted: false,
      }
    );
  };

  const initialProgress = getInitialProgressForTechLevel(
    savedState?.currentTech,
    savedState?.currentLevel,
  );

  const [currentQuestion, setCurrentQuestion] = useState(
    initialProgress.currentQuestion || 0,
  );
  const [userAnswers, setUserAnswers] = useState(
    initialProgress.userAnswers || {},
  );
  const [showResults, setShowResults] = useState(
    initialProgress.showResults || false,
  );
  const [isLoggedIn, setIsLoggedIn] = useState(!!savedState);
  const [completedQuestions, setCompletedQuestions] = useState(
    new Set(initialProgress.completedQuestions || []),
  );
  const [progressByTech, setProgressByTech] = useState(
    savedState?.progressByTech || {},
  );

  // IMPORTANT: keep submission & review state per-level and mirrored to local state for quick checks
  const [isSubmitted, setIsSubmitted] = useState(
    initialProgress.isSubmitted || false,
  );
  const [reviewMode, setReviewMode] = useState(
    initialProgress.reviewMode || false,
  );

  // Sidebar responsive
  // NOTE: changed default breakpoint: sidebar is open by default on large screens >= 1024 (lg)
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    // default open on larger screens (lg+), closed on md/tablet & mobile
    windowWidth >= 1024,
  );
  const asideRef = useRef(null);

  // Helpers
  const findFirstUnansweredIndex = (answersObj = {}, total = 0) => {
    for (let i = 0; i < total; i++) {
      if (answersObj[i] === undefined) return i;
    }
    return -1;
  };

  const findLastCompletedQuestion = (answersObj = {}, total = 0) => {
    for (let i = total - 1; i >= 0; i--) {
      if (answersObj[i] !== undefined) return i;
    }
    return -1;
  };

  const getTimeLimit = (tech, level) => {
    if (!tech || !level) return 0;

    const time = questionsData?.[tech]?.[level]?.timeLimit;

    return time ? time * 60 : 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // NEW: Format elapsed time for display (HH:MM:SS or MM:SS)
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours
        .toString()
        .padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateElapsedTime = () => {
    if (!timerStartedAt) return elapsedTime;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - timerStartedAt) / 1000);
    return elapsedTime + elapsedSeconds;
  };

  // Persist helper: update progressByTech for a specific tech/level and save to localStorage immediately
  const persistProgressForLevel = (tech, level, levelProgress) => {
    if (!tech || !level) return;
    const updatedProgress = {
      ...progressByTech,
      [tech]: {
        ...(progressByTech[tech] || {}),
        [level]: {
          ...(progressByTech[tech]?.[level] || {}),
          ...levelProgress,
        },
      },
    };
    setProgressByTech(updatedProgress);

    // Save to localStorage
    try {
      const stateToSave = {
        currentTech: tech,
        currentLevel: level,
        progressByTech: updatedProgress,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed saving state:", err);
    }
  };

  const saveTimerState = () => {
    if (selectedTech && selectedLevel) {
      const currentElapsed = calculateElapsedTime();
      // Persist per-level immediately (so other levels remain untouched)
      persistProgressForLevel(selectedTech, selectedLevel, {
        currentQuestion,
        userAnswers,
        showResults,
        completedQuestions: Array.from(completedQuestions),
        isSubmitted,
        reviewMode,
        timeLeft,
        timerStartedAt: isTimerRunning ? Date.now() : null,
        elapsedTime: currentElapsed,
        isQuizStarted,
      });
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isSubmitted || reviewMode) return;

    setIsTimerRunning(true);

    const startTime = Date.now();
    setTimerStartedAt(startTime);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsTimerRunning(false);
    saveTimerState();
  };

  const resetTimer = () => {
    stopTimer();
    if (selectedLevel && !isSubmitted && !reviewMode && !showResults) {
      const fullTime = getTimeLimit(selectedTech, selectedLevel);
      setTimeLeft(fullTime);
      setTimerStartedAt(null);
      setElapsedTime(0);

      // Update progress immediately
      if (selectedTech && selectedLevel) {
        persistProgressForLevel(selectedTech, selectedLevel, {
          ...progressByTech[selectedTech]?.[selectedLevel],
          timeLeft: fullTime,
          timerStartedAt: null,
          elapsedTime: 0,
        });
      }
    }
  };
  // Manage Time Up: Auto-submit quiz, calculate score, save result, and update UI state
  const handleTimeUp = async () => {
    // 🛑 Step 1: Lock Redundancy - Ensure auto-submit ek hi baar trigger ho
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;

    // Step 2: Stop UI Timer
    stopTimer();

    try {
      const questions = getQuestions();
      if (!questions || questions.length === 0) return;

      // 📝 Step 3: Preparation - Jo unanswered hain unhe -1 mark karo (Auto-submit behavior)
      let newAnswers = { ...userAnswers };
      questions.forEach((_, index) => {
        if (newAnswers[index] === undefined || newAnswers[index] === null) {
          newAnswers[index] = -1;
        }
      });

      setUserAnswers(newAnswers);

      // Time taken will be the full limit since time is up
      const finalElapsedTime = getTimeLimit(selectedTech, selectedLevel);

      // 📊 Step 4: Calculate Final Score
      let correct = 0;
      let wrong = 0;
      questions.forEach((q, index) => {
        const userAns = newAnswers[index];
        if (userAns !== -1) {
          if (userAns === q.correctAnswer) {
            correct++;
          } else {
            wrong++;
          }
        }
      });

      // 🚀 Step 5: Backend Call (Direct hit as Token is managed by useApi)
      // Note: Isme isSignedIn check isliye nahi hai kyunki quiz start hi tab hua tha jab user logged in tha
      await request("/result/save-result", "POST", {
        technology: selectedTech,
        level: selectedLevel,
        totalQuestions: questions.length,
        correct: correct,
        wrong: wrong,
        timeTaken: finalElapsedTime,
        startDate: new Date(),
      });

      // ✅ Step 6: Final UI State Update
      setIsSubmitted(true);
      setIsQuizStarted(false);
      setShowResults(true);
      setTimeLeft(0);
      setTimerStartedAt(null);
      setElapsedTime(finalElapsedTime);

      // 💾 Step 7: Persist State
      saveTimerState();
    } catch (err) {
      console.error("AUTO SUBMIT BACKEND ERROR:", err);
      // Even if API fails, we show results to user so they don't get stuck
      setShowResults(true);
      setIsSubmitted(true);
      setIsQuizStarted(false);
    }
  };

  // Start Quiz Function
  const handleStartQuiz = () => {
    //  Step 1: Check if user is logged in
    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }

    // ✅ Step 2: If logged in, continue with original logic
    hasAutoSubmittedRef.current = false;

    if (!selectedTech || !selectedLevel) return;

    const now = Date.now();
    const fullTime = getTimeLimit(selectedTech, selectedLevel);

    setIsQuizStarted(true);
    setTimeLeft(fullTime);
    setTimerStartedAt(now);
    setElapsedTime(0);
    setCurrentQuestion(0);
    setUserAnswers({});
    setCompletedQuestions(new Set());
    setShowResults(false);
    setIsSubmitted(false);
    setReviewMode(false);

    persistProgressForLevel(selectedTech, selectedLevel, {
      currentQuestion: 0,
      userAnswers: {},
      showResults: false,
      completedQuestions: [],
      isSubmitted: false,
      reviewMode: false,
      timeLeft: fullTime,
      timerStartedAt: now,
      elapsedTime: 0,
      isQuizStarted: true,
    });

    startTimer();
  };

  // Time
  useEffect(() => {
    if (timeLeft === 0 && isQuizStarted && !isSubmitted && !reviewMode) {
      handleTimeUp();
    }
  }, [timeLeft, isQuizStarted, isSubmitted, reviewMode]);

  // Show real data from db
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await request("/admin/quizzes");

        console.log("REAL DB:", data);

        const formatted = {};
        const techList = [];

        data.forEach((q) => {
          const tech = q.technology?.toLowerCase();
          const level = q.level;

          if (!formatted[tech]) {
            formatted[tech] = {};

            const IconComponent = techIconMap[tech?.toLowerCase()] || Cpu;

            const formatTechName = (name) =>
              name.charAt(0).toUpperCase() + name.slice(1);

            techList.push({
              id: tech,
              name: formatTechName(q.technology),
              color: colorSchemes[tech?.toUpperCase()] || "",
              icon: IconComponent,
            });
          }

          formatted[tech][level] = {
            questions: q.questions.map((question) => {
              let correctIndex = question.answerKey; // DB me answerKey hai

              if (typeof correctIndex === "string") {
                correctIndex = ["A", "B", "C", "D"].indexOf(
                  correctIndex.toUpperCase(),
                );
              }

              return {
                ...question,
                correctAnswer: correctIndex,
              };
            }),
            timeLimit: q.timeLimit,
          };
        });

        setQuestionsData(formatted);
        // Inside the useEffect after the data.forEach loop
        setTechnologies(techList.reverse()); // ← add .reverse()
      } catch (err) {
        console.log("FETCH ERROR:", err);
      }
    };

    loadQuizzes();
  }, []);

  // Persist to localStorage whenever relevant state changes (global progressByTech managed by persist helper)
  useEffect(() => {
    try {
      const stateToSave = {
        currentTech: selectedTech,
        currentLevel: selectedLevel,
        progressByTech: progressByTech,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed saving state:", err);
    }
  }, [selectedTech, selectedLevel, progressByTech]);

  // Initialize timer when level is selected or on refresh - ONLY if quiz was already started
  useEffect(() => {
    if (
      selectedLevel &&
      selectedTech &&
      !showResults &&
      !isSubmitted &&
      !reviewMode &&
      isQuizStarted
    ) {
      // Get saved progress for this tech/level
      const savedProgress = progressByTech[selectedTech]?.[selectedLevel];

      if (savedProgress) {
        const {
          timeLeft: savedTimeLeft,
          elapsedTime: savedElapsedTime,
          timerStartedAt: savedTimerStartedAt,
        } = savedProgress;

        if (savedTimerStartedAt && !isSubmitted && !reviewMode) {
          // Calculate actual time left considering elapsed time
          const totalTime = getTimeLimit(selectedTech, selectedLevel);
          const currentElapsed = savedElapsedTime || 0;
          const remainingTime = Math.max(totalTime - currentElapsed, 0);

          setTimeLeft(remainingTime);
          setElapsedTime(currentElapsed);

          if (remainingTime > 0 && !isSubmitted && !reviewMode) {
            // Resume timer from where it left off
            setTimerStartedAt(Date.now() - currentElapsed * 1000);
            startTimer();
          } else {
            // Time's up
            handleTimeUp();
          }
        } else {
          // Start fresh timer
          const fullTime = getTimeLimit(selectedTech, selectedLevel);
          setTimeLeft(fullTime);
          setTimerStartedAt(Date.now());
          setElapsedTime(0);
          startTimer();
        }
      } else {
        // Start fresh timer
        const fullTime = getTimeLimit(selectedTech, selectedLevel);
        setTimeLeft(fullTime);
        setTimerStartedAt(Date.now());
        setElapsedTime(0);
        startTimer();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, selectedTech, isQuizStarted]);

  // Clean up timer on unmount

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (isTimerRunning) {
        saveTimerState();
      }
    };
  }, [isTimerRunning]);

  // Save timer state when component loses focus (user navigates away)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        saveTimerState();
      }
    };

    const handleBeforeUnload = (e) => {
      if (isTimerRunning) {
        saveTimerState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    isTimerRunning,
    selectedTech,
    selectedLevel,
    timeLeft,
    timerStartedAt,
    elapsedTime,
  ]);

  // Responsive sidebar open by default on lg+; also track window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // change threshold to 1024 (lg) so tablet (md) behaves like mobile
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scroll when overlay shown on small & medium screens (now < 1024)
  useEffect(() => {
    // we'll hide body scroll when sidebar is open on widths < 1024 to prevent layout shift
    if (isSidebarOpen && windowWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen, windowWidth]);

  // Click outside to close sidebar (works on all sizes)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        asideRef.current &&
        !asideRef.current.contains(e.target) &&
        isSidebarOpen &&
        // only close when screen is smaller than lg (so tablet+mobile) - keep normal desktop behaviour intact
        windowWidth < 1024
      ) {
        setIsSidebarOpen(false);
      }
    };

    const handleTouchStart = (e) => handleOutsideClick(e);

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleTouchStart);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isSidebarOpen, windowWidth]);

  // Prevent background scroll when overlay shown on small screens
  useEffect(() => {
    if (windowWidth < 1024) {
      if (isSidebarOpen) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
    }
    // don't clear here; separate overflow effect handles restoring
  }, [isSidebarOpen, windowWidth]);

  //  AutoSubmit when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft === 0 && isQuizStarted && !isSubmitted && !reviewMode) {
      handleTimeUp();
    }
  }, [timeLeft, isQuizStarted, isSubmitted, reviewMode]);

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const handleLogout = async () => {
    try {
      // Save current state before logging out
      saveTimerState();
      await signOut();
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogin = () => {
    const saved = loadSavedState();
    if (saved) {
      setProgressByTech(saved.progressByTech || {});

      if (saved.currentTech && saved.currentLevel) {
        setSelectedTech(saved.currentTech);
        setSelectedLevel(saved.currentLevel);

        const progress = saved.progressByTech?.[saved.currentTech]?.[
          saved.currentLevel
        ] || {
          currentQuestion: 0,
          userAnswers: {},
          showResults: false,
          completedQuestions: [],
          isSubmitted: false,
          reviewMode: false,
          timeLeft: 0,
          timerStartedAt: null,
          elapsedTime: 0,
          isQuizStarted: false,
        };

        setIsQuizStarted(progress.isQuizStarted || false);

        const questions =
          questionsData?.[saved.currentTech]?.[saved.currentLevel] || [];
        const firstUnanswered = findFirstUnansweredIndex(
          progress.userAnswers || {},
          questions.length,
        );

        if (firstUnanswered >= 0) setCurrentQuestion(firstUnanswered);
        else setCurrentQuestion(progress.currentQuestion || 0);

        setUserAnswers(progress.userAnswers || {});
        setShowResults(progress.showResults || false);
        setCompletedQuestions(new Set(progress.completedQuestions || []));
        setIsSubmitted(progress.isSubmitted || false);
        setReviewMode(progress.reviewMode || false);
        setElapsedTime(progress.elapsedTime || 0);

        // Restore timer state if quiz was started
        if (
          progress.isQuizStarted &&
          progress.timeLeft > 0 &&
          !progress.isSubmitted &&
          !progress.reviewMode
        ) {
          const totalTime = getTimeLimit(saved.currentTech, saved.currentLevel);
          const remainingTime = Math.max(
            totalTime - (progress.elapsedTime || 0),
            0,
          );
          setTimeLeft(remainingTime);
          setTimerStartedAt(Date.now() - (progress.elapsedTime || 0) * 1000);
          startTimer();
        } else {
          setTimeLeft(progress.timeLeft || 0);
          setTimerStartedAt(progress.timerStartedAt || null);
        }
      }

      setIsLoggedIn(true);
    }
  };

  const getQuestions = (tech = selectedTech, level = selectedLevel) => {
    if (!tech || !level) return [];
    return questionsData[tech]?.[level]?.questions || [];
  };

  const getProgressForTechLevel = (techId, levelId) => {
    const progress = progressByTech?.[techId]?.[levelId];
    if (!progress || !progress.userAnswers) return { answered: 0, total: 0 };
    const questions = questionsData[techId]?.[levelId]?.questions || [];

    const answered = Object.keys(progress.userAnswers).filter(
      (key) =>
        progress.userAnswers[key] !== undefined &&
        progress.userAnswers[key] !== -1,
    ).length;
    return {
      answered,
      total: questions.length,
    };
  };

  const isTechLevelCompleted = (techId, levelId) => {
    const progress = progressByTech?.[techId]?.[levelId];
    if (!progress || !progress.userAnswers) return false;

    const questions = questionsData[techId]?.[levelId]?.questions || [];

    return questions.every(
      (_, index) =>
        progress.userAnswers[index] !== undefined &&
        progress.userAnswers[index] !== -1,
    );
  };

  const handleTechSelect = (techId) => {
    // Save current timer state before switching
    if (isTimerRunning) {
      saveTimerState();
    }

    if (selectedTech === techId) {
      setSelectedTech(null);
      setSelectedLevel(null);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
      setCompletedQuestions(new Set());
      setIsSubmitted(false);
      setReviewMode(false);
      setIsQuizStarted(false);
      setTimeLeft(0);
      setTimerStartedAt(null);
      setElapsedTime(0);
      stopTimer();
    } else {
      setSelectedTech(techId);
      setSelectedLevel(null);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
      setCompletedQuestions(new Set());
      setIsSubmitted(false);
      setReviewMode(false);
      setIsQuizStarted(false);
      setTimeLeft(0);
      setTimerStartedAt(null);
      setElapsedTime(0);
      stopTimer();
    }

    setTimeout(() => {
      const el = asideRef.current?.querySelector(`[data-tech="${techId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const handleLevelSelect = (levelId) => {
    // Save current timer state before switching
    if (isTimerRunning) {
      saveTimerState();
      stopTimer();
    }

    setSelectedLevel(levelId);
    setIsQuizStarted(false); // Reset quiz start state when selecting new level

    const progress = progressByTech?.[selectedTech]?.[levelId];
    if (progress) {
      const questions = getQuestions(selectedTech, levelId);
      const firstUnanswered = findFirstUnansweredIndex(
        progress.userAnswers || {},
        questions.length,
      );
      if (firstUnanswered >= 0) setCurrentQuestion(firstUnanswered);
      else setCurrentQuestion(progress.currentQuestion || 0);

      setUserAnswers(progress.userAnswers || {});
      setShowResults(progress.showResults || false);
      setCompletedQuestions(new Set(progress.completedQuestions || []));
      // IMPORTANT: set local isSubmitted/reviewMode from stored per-level progress
      setIsSubmitted(progress.isSubmitted || false);
      setReviewMode(progress.reviewMode || false);
      setIsQuizStarted(progress.isQuizStarted || false);
      setElapsedTime(progress.elapsedTime || 0);

      // Restore timer if quiz was active
      if (
        progress.isQuizStarted &&
        !progress.isSubmitted &&
        !progress.reviewMode &&
        progress.timeLeft > 0
      ) {
        const totalTime = getTimeLimit(selectedTech, levelId);
        const remainingTime = Math.max(
          totalTime - (progress.elapsedTime || 0),
          0,
        );
        setTimeLeft(remainingTime);
        setTimerStartedAt(Date.now() - (progress.elapsedTime || 0) * 1000);
        startTimer();
      } else {
        setTimeLeft(progress.timeLeft || 0);
        setTimerStartedAt(progress.timerStartedAt || null);
      }
    } else {
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
      setCompletedQuestions(new Set());
      setIsSubmitted(false);
      setReviewMode(false);
      setIsQuizStarted(false);
      const fullTime = getTimeLimit(selectedTech, levelId);
      setTimeLeft(fullTime);
      setTimerStartedAt(null);
      setElapsedTime(0);
    }

    // For tablet & mobile (now < 1024) close sidebar to show full content
    if (windowWidth < 1024) setIsSidebarOpen(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (!isQuizStarted || isSubmitted || reviewMode) return;

    const newAnswers = {
      ...userAnswers,
      [currentQuestion]: answerIndex,
    };

    setUserAnswers(newAnswers);

    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestion);
    setCompletedQuestions(newCompleted);

    // ✅ REALTIME UPDATE (IMPORTANT)
    persistProgressForLevel(selectedTech, selectedLevel, {
      ...progressByTech[selectedTech]?.[selectedLevel],
      userAnswers: newAnswers,
      completedQuestions: Array.from(newCompleted),
    });
  };

  const handleQuestionNavigation = (direction) => {
    if (!isQuizStarted && !reviewMode) return; // Prevent navigation if quiz not started and not in review mode

    if (isSubmitted || reviewMode) {
      // Allow free navigation in review/submitted mode
      if (direction === "prev" && currentQuestion > 0)
        setCurrentQuestion(currentQuestion - 1);
      else if (direction === "next" && currentQuestion < questions.length - 1)
        setCurrentQuestion(currentQuestion + 1);
      return;
    }

    const questions = getQuestions();
    if (direction === "prev" && currentQuestion > 0)
      setCurrentQuestion(currentQuestion - 1);
    else if (direction === "next" && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleDirectQuestionClick = (questionIndex) => {
    if (!isQuizStarted && !reviewMode) return; // Prevent clicking if quiz not started and not in review mode

    if (isSubmitted || reviewMode) {
      setCurrentQuestion(questionIndex);
      return;
    }

    setCurrentQuestion(questionIndex);
  };

  const calculateScore = () => {
    const questions = getQuestions();
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];

      if (userAnswer === undefined || userAnswer === -1) {
        unattempted++;
      } else if (userAnswer === question.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      correct,
      incorrect,
      unattempted,
      total,
      percentage,
    };
  };

  const handleSubmitQuiz = () => {
    if (!isQuizStarted && !reviewMode) return;

    // already submitted → just show results
    if (isSubmitted) {
      setShowResults(true);
      setReviewMode(false);
      return;
    }

    // open professional modal instead of window.confirm
    setShowSubmitModal(true);
  };
  // if (isSubmitted) return null;

  const confirmSubmit = async () => {
    // 🛑 Step 1: Security Guard - Agar user login nahi hai toh hit nahi hone dena
    if (!isSignedIn) {
      setShowSubmitModal(false); // Modal band karo
      openSignIn(); // Clerk login popup dikhao
      return;
    }

    try {
      // 🛑 Step 2: Validation - Check karo questions load huye hain ya nahi
      const questions = getQuestions();
      if (!questions || questions.length === 0) {
        console.error("No questions found to submit.");
        return;
      }

      // 📝 Step 3: Answers Preparation - Jo attempt nahi huye unhe -1 mark karo
      let newAnswers = { ...userAnswers };
      questions.forEach((_, index) => {
        if (newAnswers[index] === undefined || newAnswers[index] === null) {
          newAnswers[index] = -1;
        }
      });

      // Step 4: Logic - Timer stop karo aur total time calculate karo
      stopTimer();
      const finalElapsedTime = calculateElapsedTime();

      // 📊 Step 5: Score Calculation - Frontend par results dikhane ke liye
      let correct = 0;
      let wrong = 0;
      questions.forEach((q, index) => {
        const userAns = newAnswers[index];
        if (userAns !== -1) {
          if (userAns === q.correctAnswer) {
            correct++;
          } else {
            wrong++;
          }
        }
      });

      const totalQuestions = questions.length;

      // 🚀 Step 6: Backend Call - Axios useApi hook ke through
      // Payload wahi hai jo aapka backend save-result endpoint mang raha hai
      await request("/result/save-result", "POST", {
        technology: selectedTech,
        level: selectedLevel,
        totalQuestions: totalQuestions,
        correct: correct,
        wrong: wrong,
        timeTaken: finalElapsedTime,
        startDate: new Date(),
      });

      // ✅ Step 7: UI Update - Quiz state ko results screen par le jao
      setUserAnswers(newAnswers); // Final marked answers set karo
      setShowResults(true);
      setIsSubmitted(true);
      setIsQuizStarted(false);
      setTimeLeft(0);
      setElapsedTime(finalElapsedTime);
      setShowSubmitModal(false); // Confirmation modal band karo

      // 💾 Step 8: Persistence - LocalStorage mein progress save karo taaki refresh par result na jaye
      saveTimerState();
    } catch (err) {
      // Error handling - Axios error log dikhayega
      console.error("MANUAL SUBMIT ERROR:", err);
      alert(err.message || "Failed to submit quiz. Please try again.");
    }
  };

  // FIXED: Handle Review Mode properly
  const handleReviewMode = () => {
    const questions = getQuestions();

    if (!questions.length) return;

    setCurrentQuestion(0); // FIRST reset index

    setReviewMode(true);
    setShowResults(false);

    stopTimer();
  };

  const resetQuiz = () => {
    const questions = getQuestions();
    const lastCompleted = findLastCompletedQuestionLocal();
    if (lastCompleted >= 0 && lastCompleted + 1 < questions.length)
      setCurrentQuestion(lastCompleted + 1);
    else setCurrentQuestion(0);
    setShowResults(false);
    setReviewMode(false);

    if (!isSubmitted) {
      resetTimer();
      startTimer();
    }
  };

  const findLastCompletedQuestionLocal = () => {
    const questions = getQuestions();
    for (let i = questions.length - 1; i >= 0; i--) {
      if (userAnswers[i] !== undefined) return i;
    }
    return -1;
  };

  const restartQuiz = () => {
    if (!selectedTech || !selectedLevel) return;

    setShowRestartModal(true);
  };

  const confirmRestart = () => {
    // Stop and clear current timer
    stopTimer();

    // Reset all quiz states
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
    setCompletedQuestions(new Set());
    setIsSubmitted(false);
    setReviewMode(false);
    setIsQuizStarted(false);

    // Reset timer states with fresh start
    const fullTime = getTimeLimit(selectedTech, selectedLevel);
    setTimeLeft(fullTime);
    setTimerStartedAt(Date.now());
    setElapsedTime(0);

    // Don't start timer automatically - wait for user to click Start Quiz
    // Update progressByTech immediately for this level
    if (selectedTech && selectedLevel) {
      persistProgressForLevel(selectedTech, selectedLevel, {
        currentQuestion: 0,
        userAnswers: {},
        showResults: false,
        completedQuestions: [],
        isSubmitted: false,
        reviewMode: false,
        timeLeft: fullTime,
        timerStartedAt: Date.now(),
        elapsedTime: 0,
        isQuizStarted: false,
      });
    }
  };

  const clearAllProgress = () => {
    if (
      window.confirm(
        "Are you sure you want to clear ALL progress?\n\nThis will delete all saved quiz data for all technologies and levels.",
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedTech(null);
      setSelectedLevel(null);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
      setCompletedQuestions(new Set());
      setIsSubmitted(false);
      setReviewMode(false);
      setIsQuizStarted(false);
      setProgressByTech({});
      setTimeLeft(0);
      setTimerStartedAt(null);
      setElapsedTime(0);
      stopTimer();
      setIsLoggedIn(false);
    }
  };

  const questions = getQuestions();
  const currentQ = questions[currentQuestion];
  const score = calculateScore();
  const getPerformanceStatus = () => {
    if (score.percentage >= 90)
      return {
        text: "Outstanding!",
        color: "bg-gradient-to-r from-amber-100 to-amber-50",
        icon: <Sparkles className="text-amber-600" />,
        textColor: "text-amber-800",
      };
    if (score.percentage >= 75)
      return {
        text: "Excellent!",
        color: "bg-gradient-to-r from-indigo-100 to-violet-50",
        icon: <Trophy className="text-indigo-600" />,
        textColor: "text-indigo-800",
      };
    if (score.percentage >= 60)
      return {
        text: "Good Job!",
        color: "bg-gradient-to-r from-emerald-100 to-teal-50",
        icon: <Award className="text-emerald-600" />,
        textColor: "text-emerald-800",
      };
    return {
      text: "Keep Practicing",
      color: "bg-gradient-to-r from-gray-100 to-gray-50",
      icon: <BookOpen className="text-gray-600" />,
      textColor: "text-gray-800",
    };
  };

  const performance = getPerformanceStatus();

  // Get time color based on remaining time
  const timeColor = getTimeColor(
    timeLeft,
    getTimeLimit(selectedTech, selectedLevel),
    isSubmitted,
    reviewMode,
  );

  // Get question status
  const getQuestionStatus = (index) => {
    const question = questions[index];

    if (!question) return "unattempted";

    const answer = userAnswers[index];

    if (answer === undefined || answer === -1) {
      return "unattempted";
    }

    if (answer === question.correctAnswer) {
      return "correct";
    }

    return "incorrect";
  };

  // Get answer feedback for current question
  const getAnswerFeedback = () => {
    if (!currentQ) return null;

    const userAnswer = userAnswers[currentQuestion];
    const isCorrect = userAnswer === currentQ.correctAnswer;
    const isUnattempted = userAnswer === undefined || userAnswer === -1;

    return {
      userAnswer,
      isCorrect,
      isUnattempted,
      correctAnswer: currentQ.correctAnswer,
      explanation:
        currentQ.explanation ||
        `The correct answer is option ${currentQ.correctAnswer + 1}`,
    };
  };

  const answerFeedback = getAnswerFeedback();

  // compute boolean for "is mobile" usage in markup
  // NOTE: treat widths < 1024 (lg) as mobile/tablet for layout/overlay behavior
  const isMobile = windowWidth < 1024;

  // ======= New small UI additions (non-functional) =======
  // Determine if current question is filled (answered) so we can show blue light
  const isCurrentAnswered =
    userAnswers[currentQuestion] !== undefined &&
    userAnswers[currentQuestion] !== -1;

  // Additional CSS to append to existing styles (non-invasive)
  const extraCss = `
    /* subtle blue highlight for answered question card */
    .filled-question {
      transition: box-shadow 220ms ease, border-color 220ms ease, transform 220ms ease;
      box-shadow: 0 10px 30px rgba(59,130,246,0.10), 0 0 0 6px rgba(96,165,250,0.03);
      border: 1px solid rgba(59,130,246,0.12) !important;
      transform: translateY(-2px);
    }

    /* question number indicator when that question is answered */
    .filled-indicator {
      transition: box-shadow 220ms ease, background 220ms ease, transform 220ms ease;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.06);
      background: linear-gradient(90deg, rgba(96,165,250,0.08), rgba(59,130,246,0.06));
      border-radius: 8px;
      transform: translateY(-1px);
    }

    /* small focus ring for current + answered indicator */
    .question-indicator.filled-indicator:focus {
      outline: none;
      box-shadow: 0 0 0 10px rgba(59,130,246,0.06);
    }

    /* mobile: ensure highlight remains subtle */
    @media (max-width: 1024px) {
      .filled-question { box-shadow: 0 6px 18px rgba(59,130,246,0.08); }
    }
      @keyframes scaleIn {
  from {
     opacity:0;
     transform:scale(.95);
  }
  to {
     opacity:1;
     transform:scale(1);
  }
}

  `;
  
  // UI PART
  return (
    <div className={sidebarStyles.container}>
      {/* overlay when sidebar open on small/medium screens */}
      {isSidebarOpen && windowWidth < 1024 && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className={sidebarStyles.overlay}
          aria-hidden
        />
      )}

      <div className={sidebarStyles.flexContainer}>
        {/* Sidebar */}
        <aside
          ref={asideRef}
          className={`${sidebarStyles.sidebar} ${
            isSidebarOpen
              ? sidebarStyles.sidebarOpen
              : sidebarStyles.sidebarClosed
          }`}
          aria-hidden={!isSidebarOpen && isMobile}
        >
          {/* Sidebar Header */}

          <div className={sidebarStyles.sidebarHeader}>
            <div className={sidebarStyles.headerContent}>
              <div
                className={`${sidebarStyles.logoContainer} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={handleHomeClick}
              >
                <div className={sidebarStyles.logoIcon}>
                  <BookOpen size={28} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className={sidebarStyles.title}>Tech Quiz Master</h1>
                  <p className={sidebarStyles.subtitle}>Test • Learn • Grow</p>
                </div>
              </div>

              {/* Close button for small/tablet screens */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={sidebarStyles.closeButton}
                  aria-label="Close sidebar"
                >
                  <X size={18} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className={sidebarStyles.sidebarContent}>
            <div className={sidebarStyles.techSectionHeader}>
              <h2 className={sidebarStyles.techTitle}>
                <span className={sidebarStyles.techTitleAccent}></span>
                Technologies
              </h2>
              <span className={sidebarStyles.techCountBadge}>
                {technologies.length} Techs
              </span>
            </div>

            {technologies.map((tech) => {
              const Icon = tech.icon;

              return (
                <div key={tech.id} className="mb-3" data-tech={tech.id}>
                  <button
                    onClick={() => handleTechSelect(tech.id)}
                    className={`${sidebarStyles.techButton} ${
                      selectedTech === tech.id
                        ? `${tech.color || ""} ${sidebarStyles.techButtonSelected}`
                        : sidebarStyles.techButtonUnselected
                    }`}
                  >
                    <div className={sidebarStyles.techIconContainer}>
                      <span
                        className={`${sidebarStyles.techIcon} ${tech.color || ""}`}
                      >
                        {Icon && <Icon size={20} />}
                      </span>
                      <span className={sidebarStyles.techName}>
                        {tech.name}
                      </span>
                    </div>

                    {selectedTech === tech.id ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>

                  {/* 🔥 ADD THIS LEVEL BLOCK BACK */}

                  {selectedTech === tech.id && (
                    <div className={sidebarStyles.levelContainer}>
                      {getLevelsForTech(tech.id).map((level) => {
                        const progress = getProgressForTechLevel(
                          tech.id,
                          level.id,
                        );
                        const isCompleted = isTechLevelCompleted(
                          tech.id,
                          level.id,
                        );

                        return (
                          <button
                            key={level.id}
                            onClick={() => handleLevelSelect(level.id)}
                            className={`${sidebarStyles.levelButton}
${
  selectedLevel === level.id
    ? levelColorMap[level.id.toLowerCase()] || "bg-white"
    : "bg-white"
}
`}
                            style={{
                              color:
                                colorSchemes[selectedTech?.toUpperCase()] || "",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            {/* ROW 1 */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-lg shadow-sm flex items-center justify-center
  ${
    selectedLevel === level.id
      ? "bg-white text-indigo-600"
      : "bg-gray-100 text-gray-600"
  }`}
                                >
                                  {level.icon}
                                </div>

                                <span className="font-medium text-gray-800">
                                  {level.name}
                                </span>
                              </div>

                              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                {level.questions} Qs
                              </span>
                            </div>

                            {/* ROW 2 (time right aligned) */}
                            <div className="flex justify-end mt-2">
                              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium flex items-center gap-1">
                                <Clock size={12} />
                                {level.time}
                              </span>
                            </div>

                            {/* ROW 3 (answered LEFT) */}

                            {/* ROW 3 */}
                            <div className="flex items-center justify-between mt-2">
                              {/* LEFT SIDE — answered */}
                              {progress.answered > 0 ? (
                                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                  {progress.answered}/{progress.total} answered
                                </span>
                              ) : (
                                <span></span>
                              )}

                              {/* RIGHT SIDE — optional completed badge */}
                              {isCompleted && (
                                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                                  Completed
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sidebar Footer */}
            <div className={sidebarStyles.sidebarFooter}>
              <div className="flex flex-col space-y-3">
                <div className={sidebarStyles.footerTextContainer}>
                  <p className={sidebarStyles.footerText1}>
                    Master your skills one quiz at a time
                  </p>
                  <p className={sidebarStyles.footerText2}>
                    Keep Learning, Keep Growing!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={sidebarStyles.mainContent}>
          {/* Mobile/Header with hamburger - now visible on tablet (md) and mobile */}
          <div className={sidebarStyles.mobileHeader}>
            <button
              onClick={toggleSidebar}
              className={sidebarStyles.hamburgerButton}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className="text-slate-700" />
            </button>
          </div>

          {/* Mobile/Tablet Level Selection */}
          {selectedTech && !selectedLevel && (
            <div className={sidebarStyles.mobileLevelContainer}>
              <div className={sidebarStyles.mobileLevelScroll}>
                {getLevelsForTech(selectedTech).map((l) => {
                  const progress = getProgressForTechLevel(selectedTech, l.id);
                  const isCompleted = isTechLevelCompleted(selectedTech, l.id);

                  return (
                    <button
                      key={l.id}
                      onClick={() => handleLevelSelect(l.id)}
                      className={sidebarStyles.mobileLevelButton}
                    >
                      <div className={sidebarStyles.mobileLevelContent}>
                        <span className={sidebarStyles.mobileLevelName}>
                          {l.name}
                        </span>

                        <div className={sidebarStyles.mobileLevelStats}>
                          <span className={sidebarStyles.questionCountBadge}>
                            {l.questions} Qs
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 mt-1">
                          {progress.answered > 0 && (
                            <span className={sidebarStyles.answeredBadge}>
                              {progress.answered}
                            </span>
                          )}
                          {isCompleted && (
                            <span className={sidebarStyles.completedBadge}>
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedTech ? (
            <div className={sidebarStyles.emptyState}>
              <div className={sidebarStyles.emptyStateCard}>
                <div className={sidebarStyles.emptyStateHeader}>
                  <div className={sidebarStyles.emptyStateIconContainer}>
                    <Brain className="w-6 h-6 text-rose-600" />
                  </div>
                  <h2 className={sidebarStyles.emptyStateTitle}>
                    Tech Quiz Master
                  </h2>
                  <p className={sidebarStyles.emptyStateSubtitle}>
                    Select a technology from the sidebar to begin your quiz
                    journey
                  </p>
                </div>

                <div className={sidebarStyles.featureCardsGrid}>
                  {/* Card 1 */}
                  <div className={sidebarStyles.featureCard}>
                    <div
                      className={`${sidebarStyles.featureCardGlow} bg-linear-to-r from-rose-300 to-orange-300`}
                    ></div>
                    <div
                      className={`${sidebarStyles.featureCardBody} border-rose-100/60`}
                    >
                      <div
                        className={`${sidebarStyles.featureCardIconContainer} bg-linear-to-br from-rose-50 to-orange-50 ring-rose-100`}
                      >
                        <Star className="w-5 h-5 text-rose-600" />
                      </div>
                      <h3 className={sidebarStyles.featureCardTitle}>
                        Multiple Technologies
                      </h3>
                      <div className={sidebarStyles.featureCardList}>
                        <div className={sidebarStyles.featureListItem}>
                          <div
                            className={`${sidebarStyles.listDot} bg-rose-400`}
                          ></div>
                          <span>HTML & CSS Fundamentals</span>
                        </div>
                        <div className={sidebarStyles.featureListItem}>
                          <div
                            className={`${sidebarStyles.listDot} bg-orange-400`}
                          ></div>
                          <span>JavaScript & React</span>
                        </div>
                        <div className={sidebarStyles.featureListItem}>
                          <div
                            className={`${sidebarStyles.listDot} bg-amber-400`}
                          ></div>
                          <span>And many more technologies</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className={sidebarStyles.featureCard}>
                    <div
                      className={`${sidebarStyles.featureCardGlow} bg-linear-to-r from-amber-300 to-yellow-300`}
                    ></div>
                    <div
                      className={`${sidebarStyles.featureCardBody} border-amber-100/60`}
                    >
                      <div
                        className={`${sidebarStyles.featureCardIconContainer} bg-linear-to-br from-amber-50 to-yellow-50 ring-amber-100`}
                      >
                        <Zap className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className={sidebarStyles.featureCardTitle}>
                        Timed Challenges
                      </h3>

                      <div className="space-y-2 grow">
                        <div className={sidebarStyles.levelStatRow}>
                          <span
                            className={`${sidebarStyles.levelStatBadge} text-amber-700 bg-amber-50`}
                          >
                            Basic
                          </span>
                          <span className={sidebarStyles.levelStatTime}>
                            5 minutes
                          </span>
                        </div>
                        <div className={sidebarStyles.levelStatRow}>
                          <span
                            className={`${sidebarStyles.levelStatBadge} text-orange-700 bg-orange-50`}
                          >
                            Intermediate
                          </span>
                          <span className={sidebarStyles.levelStatTime}>
                            10 minutes
                          </span>
                        </div>
                        <div className={sidebarStyles.levelStatRow}>
                          <span
                            className={`${sidebarStyles.levelStatBadge} text-rose-700 bg-rose-50`}
                          >
                            Advanced
                          </span>
                          <span className={sidebarStyles.levelStatTime}>
                            15 minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className={sidebarStyles.featureCard}>
                    <div
                      className={`${sidebarStyles.featureCardGlow} bg-linear-to-r from-teal-300 to-emerald-300`}
                    ></div>
                    <div
                      className={`${sidebarStyles.featureCardBody} border-teal-100/60`}
                    >
                      <div
                        className={`${sidebarStyles.featureCardIconContainer} bg-linear-to-br from-teal-50 to-emerald-50 ring-teal-100`}
                      >
                        <Target className="w-5 h-5 text-teal-600" />
                      </div>
                      <h3 className={sidebarStyles.featureCardTitle}>
                        Progress Tracking
                      </h3>
                      <div className="space-y-2 grow">
                        <div className={sidebarStyles.featureCheckItem}>
                          <CheckCircle
                            className={`${sidebarStyles.checkIcon} text-teal-500`}
                          />
                          <span>Auto-save per technology</span>
                        </div>
                        <div className={sidebarStyles.featureCheckItem}>
                          <CheckCircle
                            className={`${sidebarStyles.checkIcon} text-teal-500`}
                          />
                          <span>Track level completion</span>
                        </div>
                        <div className={sidebarStyles.featureCheckItem}>
                          <CheckCircle
                            className={`${sidebarStyles.checkIcon} text-teal-500`}
                          />
                          <span>Detailed performance stats</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={sidebarStyles.ctaContainer}>
                  <div className={sidebarStyles.ctaAccent}></div>
                  <div className={sidebarStyles.ctaText}>
                    <div className={sidebarStyles.ctaTextInner}>
                      <Sparkles className={sidebarStyles.ctaSparkle} />
                      Select any technology to begin!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !selectedLevel ? (
            <div className={sidebarStyles.techSelectedState}>
              <div className={sidebarStyles.techSelectedCard}>
                <div
                  className={`${sidebarStyles.techSelectedIcon} ${selectedTechObj?.color || ""}`}
                >
                  {(() => {
                    const Icon = selectedTechObj.icon;
                    return Icon ? <Icon size={28} /> : null;
                  })()}
                </div>
                <h2 className={sidebarStyles.techSelectedTitle}>
                  {selectedTechObj?.name?.charAt(0).toUpperCase() +
                    selectedTechObj?.name?.slice(1)}{" "}
                  Quiz
                </h2>
                <p className={sidebarStyles.techSelectedSubtitle}>
                  Select a difficulty level to begin your challenge
                </p>

                {isLoggedIn && selectedLevel && (
                  <div className={sidebarStyles.progressList}>
                    {(() => {
                      const progress = getProgressForTechLevel(
                        selectedTech,
                        selectedLevel,
                      );
                      if (progress.answered > 0) {
                        return (
                          <div className={sidebarStyles.progressItem}>
                            <p className={sidebarStyles.progressText}>
                              {selectedLevel.charAt(0).toUpperCase() +
                                selectedLevel.slice(1)}
                              : {progress.answered}/{progress.total} answered
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div className={sidebarStyles.readyMessage}>
                  <p className={sidebarStyles.readyText}>
                    Get ready to test your{" "}
                    {selectedTechObj?.name?.charAt(0).toUpperCase() +
                      selectedTechObj?.name?.slice(1)}{" "}
                    knowledge!
                  </p>
                </div>
              </div>
            </div>
          ) : showResults ? (
            <div className={sidebarStyles.resultsScreen}>
              <div className={sidebarStyles.resultsCard}>
                <div className={sidebarStyles.resultsHeader}>
                  <div
                    className={`${sidebarStyles.resultsIconContainer} ${performance.color}`}
                  >
                    {performance.icon}
                  </div>
                  <h2 className={sidebarStyles.resultsTitle}>
                    Quiz Completed!
                  </h2>
                  <p className={sidebarStyles.resultsSubtitle}>
                    You've completed the {selectedLevel} level of{" "}
                    {selectedTechObj?.name?.charAt(0).toUpperCase() +
                      selectedTechObj?.name?.slice(1)}
                  </p>
                  <div
                    className={`${sidebarStyles.performanceBadge} ${performance.color} ${performance.textColor}`}
                  >
                    {performance.text}
                  </div>

                  {/* ADDED: Time Taken Display */}
                  <div className={sidebarStyles.timeTakenContainer}>
                    <div className={sidebarStyles.timeTakenHeader}>
                      <Clock
                        size={20}
                        className={sidebarStyles.timeTakenIcon}
                      />
                      <span className={sidebarStyles.timeTakenText}>
                        Time Taken: {formatElapsedTime(elapsedTime)}
                      </span>
                    </div>
                    <div className={sidebarStyles.timeTakenSubtext}>
                      You completed the quiz in {formatElapsedTime(elapsedTime)}
                    </div>
                  </div>

                  <div className={sidebarStyles.scoreCardsGrid}>
                    <div
                      className={`${sidebarStyles.scoreCard} bg-linear-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/50`}
                    >
                      <div
                        className={`${sidebarStyles.scoreCardIconContainer} bg-linear-to-br from-emerald-100 to-teal-100 text-emerald-600`}
                      >
                        <CheckCircle size={24} />
                      </div>
                      <p
                        className={`${sidebarStyles.scoreCardNumber} text-emerald-600`}
                      >
                        {score.correct}
                      </p>
                      <p
                        className={`${sidebarStyles.scoreCardLabel} text-emerald-700`}
                      >
                        Correct Answers
                      </p>
                    </div>

                    <div
                      className={`${sidebarStyles.scoreCard} bg-linear-to-br from-rose-50/80 to-pink-50/80 border-rose-200/50`}
                    >
                      <div
                        className={`${sidebarStyles.scoreCardIconContainer} bg-linear-to-br from-rose-100 to-pink-100 text-rose-600`}
                      >
                        <XCircle size={24} />
                      </div>
                      <p
                        className={`${sidebarStyles.scoreCardNumber} text-rose-600`}
                      >
                        {score.incorrect}
                      </p>
                      <p
                        className={`${sidebarStyles.scoreCardLabel} text-rose-700`}
                      >
                        Incorrect Answers
                      </p>
                    </div>

                    <div
                      className={`${sidebarStyles.scoreCard} bg-orange-100 border-gray-200/50`}
                    >
                      <div
                        className={`${sidebarStyles.scoreCardIconContainer} bg-orange-50 text-gray-600`}
                      >
                        <AlertCircle size={24} />
                      </div>
                      <p
                        className={`${sidebarStyles.scoreCardNumber} text-gray-600`}
                      >
                        {score.unattempted}
                      </p>
                      <p className={sidebarStyles.scoreCardLabel}>
                        Unattempted
                      </p>
                    </div>
                  </div>

                  <div className={sidebarStyles.overallScoreContainer}>
                    <div className={sidebarStyles.overallScoreHeader}>
                      <span className={sidebarStyles.overallScoreLabel}>
                        Overall Score
                      </span>
                      <span className={sidebarStyles.overallScoreValue}>
                        {score.percentage}%
                      </span>
                    </div>
                    <div className={sidebarStyles.progressBarContainer}>
                      <div
                        className={`${sidebarStyles.progressBar} ${
                          score.percentage >= 80
                            ? "bg-linear-to-r from-emerald-400 to-teal-400"
                            : score.percentage >= 60
                              ? "bg-linear-to-r from-amber-400 to-orange-400"
                              : "bg-linear-to-r from-rose-400 to-pink-400"
                        }`}
                        style={{ width: `${score.percentage}%` }}
                      />
                    </div>
                    <div className={sidebarStyles.scoreDescription}>
                      Score based on {score.correct} correct out of{" "}
                      {score.total} questions
                    </div>
                  </div>

                  <div className={sidebarStyles.resultsButtonsContainer}>
                    <button
                      onClick={handleReviewMode}
                      className={sidebarStyles.reviewButton}
                    >
                      <Eye size={18} />
                      <span>Review Questions</span>
                    </button>

                    <button
                      onClick={restartQuiz}
                      className={sidebarStyles.restartButton}
                    >
                      <RotateCcw size={18} />
                      <span>Restart Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !isQuizStarted && !reviewMode && selectedTech && selectedLevel ? (
            // Start Quiz Screen
            <div className={sidebarStyles.startQuizScreen}>
              <div className={sidebarStyles.startQuizCard}>
                <div className={sidebarStyles.startQuizHeader}>
                  <div className={sidebarStyles.startQuizIconContainer}>
                    <PlayCircle size={48} className="text-blue-600" />
                  </div>
                  <h2 className={sidebarStyles.startQuizTitle}>
                    Ready to Start?
                  </h2>
                  <p className={sidebarStyles.startQuizSubtitle}>
                    Get ready for the {selectedLevel} level of{" "}
                    {selectedTechObj?.name?.charAt(0).toUpperCase() +
                      selectedTechObj?.name?.slice(1)}{" "}
                    quiz
                  </p>

                  <div className={sidebarStyles.quizInfoCard}>
                    <div className={sidebarStyles.quizInfoHeader}>
                      <div className={sidebarStyles.techDisplay}>
                        <div
                          className={`${sidebarStyles.techDisplayIcon} ${selectedTechObj?.color || ""}`}
                        >
                          {(() => {
                            const Icon = selectedTechObj.icon;
                            return Icon ? <Icon size={28} /> : null;
                          })()}
                        </div>
                        <div className={sidebarStyles.techDisplayText}>
                          <p className={sidebarStyles.techDisplayName}>
                            {selectedTechObj.name}
                          </p>
                          <p className={sidebarStyles.techDisplayLevel}>
                            {selectedLevel.charAt(0).toUpperCase() +
                              selectedLevel.slice(1)}{" "}
                            Level
                          </p>
                        </div>
                      </div>

                      <div className={sidebarStyles.quizStats}>
                        <div className={sidebarStyles.statItem}>
                          <div className={sidebarStyles.statNumber}>
                            {questions.length}
                          </div>
                          <div className={sidebarStyles.statLabel}>
                            Questions
                          </div>
                        </div>

                        <div className={sidebarStyles.statItem}>
                          <div className={sidebarStyles.statNumber}>
                            <Clock size={16} className="mr-1" />
                            {getTimeLimit(selectedTech, selectedLevel) / 60} min
                          </div>
                          <div className={sidebarStyles.statLabel}>
                            Time Limit
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={sidebarStyles.instructionsContainer}>
                      <h4 className={sidebarStyles.instructionsTitle}>
                        Quiz Instructions:
                      </h4>
                      <ul className={sidebarStyles.instructionsList}>
                        <li className={sidebarStyles.instructionItem}>
                          <CheckCircle
                            size={14}
                            className={sidebarStyles.instructionCheck}
                          />
                          Answer all questions within the time limit
                        </li>

                        <li className={sidebarStyles.instructionItem}>
                          <CheckCircle
                            size={14}
                            className={sidebarStyles.instructionCheck}
                          />
                          Timer starts immediately when you click "Start Quiz"
                        </li>
                        <li className={sidebarStyles.instructionItem}>
                          <CheckCircle
                            size={14}
                            className={sidebarStyles.instructionCheck}
                          />
                          Your progress is saved automatically
                        </li>
                      </ul>
                    </div>
                  </div>

                  {getProgressForTechLevel(selectedTech, selectedLevel)
                    .answered > 0 && (
                    <div className={sidebarStyles.progressWarning}>
                      <p className={sidebarStyles.warningText}>
                        You have previously answered{" "}
                        {
                          getProgressForTechLevel(selectedTech, selectedLevel)
                            .answered
                        }{" "}
                        questions. Starting fresh will reset your progress.
                      </p>
                    </div>
                  )}

                  <div className={sidebarStyles.startButtonsContainer}>
                    <button
                      onClick={handleStartQuiz}
                      className={sidebarStyles.startButton}
                    >
                      <PlayCircle size={20} />
                      <span className="font-bold">Start Quiz</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedLevel(null);
                        setIsQuizStarted(false);
                      }}
                      className={sidebarStyles.changeLevelButton}
                    >
                      Change Level
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentQ && (isQuizStarted || reviewMode) ? (
            // Quiz in progress OR Review Mode
            <div className={sidebarStyles.quizContainer}>
              {/* Timer and progress bar */}
              <div className={sidebarStyles.quizHeaderCard}>
                <div className={sidebarStyles.quizHeader}>
                  <h1 className={sidebarStyles.quizTitle}>
                    {selectedTechObj?.name?.charAt(0).toUpperCase() +
                      selectedTechObj?.name?.slice(1)}{" "}
                    -{" "}
                    {selectedLevel.charAt(0).toUpperCase() +
                      selectedLevel.slice(1)}{" "}
                    {reviewMode && (
                      <span className={sidebarStyles.reviewModeBadge}>
                        Review Mode
                      </span>
                    )}
                  </h1>
                  <div className={sidebarStyles.statsGrid}>
                    {/* Timer display */}
                    <div
                      className={`${sidebarStyles.timerDisplay} ${timeColor}`}
                    >
                      <Clock size={16} />
                      <span className={sidebarStyles.timerText}>
                        {isSubmitted || reviewMode
                          ? "00:00"
                          : formatTime(timeLeft)}
                      </span>
                    </div>
                    <span className={sidebarStyles.questionBadge}>
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    {isLoggedIn && selectedLevel && (
                      <div className={sidebarStyles.progressList}>
                        {(() => {
                          const progress = getProgressForTechLevel(
                            selectedTech,
                            selectedLevel,
                          );
                          if (progress.answered > 0) {
                            return (
                              <div className={sidebarStyles.progressItem}>
                                <p className={sidebarStyles.progressText}>
                                  {selectedLevel.charAt(0).toUpperCase() +
                                    selectedLevel.slice(1)}
                                  : {progress.answered}/{progress.total}{" "}
                                  questions answered
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className={sidebarStyles.mainProgressBarContainer}>
                  <div
                    className={sidebarStyles.mainProgressBar}
                    style={{
                      width: `${((currentQuestion + 1) / (questions.length || 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Question status indicators */}
                <div className={sidebarStyles.questionIndicators}>
                  {questions.map((_, index) => {
                    const isCurrent = index === currentQuestion;
                    const status = getQuestionStatus(index);

                    let statusColors;

                    // REVIEW MODE COLORS
                    if (reviewMode) {
                      if (status === "correct") {
                        statusColors = {
                          bgColor: "bg-green-100",
                          textColor: "text-green-700",
                        };
                      } else if (status === "incorrect") {
                        statusColors = {
                          bgColor: "bg-red-600",
                          textColor: "text-red-600",
                        };
                      } else {
                        statusColors = {
                          bgColor: "bg-amber-100",
                          textColor: "text-amber-600",
                        };
                      }
                    } else {
                      // normal quiz mode
                      statusColors = getQuestionStatusColor(status, false);
                    }

                    const isAnswered =
                      userAnswers[index] !== undefined &&
                      userAnswers[index] !== -1;

                    let borderColor = "";
                    if (isCurrent) {
                      borderColor = sidebarStyles.currentQuestion;
                    }

                    // Add our subtle filled indicator class when question answered
                    const indicatorExtraClass = isAnswered
                      ? "filled-indicator"
                      : "";

                    return (
                      <button
                        key={index}
                        onClick={() => handleDirectQuestionClick(index)}
                        className={`${sidebarStyles.questionIndicator} ${statusColors.bgColor} ${statusColors.textColor} ${borderColor} ${indicatorExtraClass}`}
                        title={`Question ${index + 1}`}
                        disabled={!isQuizStarted && !reviewMode}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Time warning */}
                {!isSubmitted && !reviewMode && timeLeft < 60 && (
                  <div className={sidebarStyles.timeWarning}>
                    <AlertCircle
                      size={16}
                      className={sidebarStyles.warningIcon}
                    />
                    Less than 1 minute remaining!
                  </div>
                )}
              </div>

              {/* Question Card */}
              {/* Add the filled-question class when the current question is answered */}
              <div
                className={`${sidebarStyles.questionCard} ${isCurrentAnswered ? "filled-question" : ""}`}
              >
                {/* Question status badge */}
                <div className={sidebarStyles.questionHeader}>
                  <div className={sidebarStyles.questionIconContainer}>
                    <div className={sidebarStyles.questionIcon}>
                      <Target size={24} />
                    </div>
                    <div>
                      <h2 className={sidebarStyles.questionTextContainer}>
                        {currentQ.question}
                      </h2>
                    </div>
                  </div>

                  {/* Show status badge only in review mode */}
                  {reviewMode ? (
                    <div
                      className={`${sidebarStyles.statusBadge} ${
                        answerFeedback.isCorrect
                          ? "bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700"
                          : answerFeedback.userAnswer !== undefined &&
                              answerFeedback.userAnswer !== -1
                            ? "bg-linear-to-r from-rose-100 to-pink-100 text-rose-700"
                            : "bg-linear-to-r from-amber-100 to-orange-100 text-amber-700"
                      }`}
                    >
                      {answerFeedback.isCorrect
                        ? " Correct"
                        : answerFeedback.userAnswer !== undefined &&
                            answerFeedback.userAnswer !== -1
                          ? " Incorrect"
                          : " Unattempted"}
                    </div>
                  ) : null}
                </div>

                {/* Options */}
                <div className={sidebarStyles.optionsContainer}>
                  {currentQ?.options?.map((option, index) => {
                    const isSelected = userAnswers[currentQuestion] === index;
                    const isCorrect = index === currentQ.correctAnswer;
                    const showFeedback = reviewMode || isSubmitted; // Only in review mode

                    const optionStyle = getOptionButtonStyle(
                      isSelected,
                      isCorrect,
                      showFeedback,
                      index,
                      currentQ.correctAnswer,
                    );

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={!isQuizStarted || isSubmitted || reviewMode}
                        className={`${sidebarStyles.optionButton} ${optionStyle.buttonClass} ${(isQuizStarted || reviewMode) && !isSubmitted && !reviewMode ? `${sidebarStyles.optionButtonHover}` : sidebarStyles.optionButtonDisabled}`}
                      >
                        <div className={sidebarStyles.optionContent}>
                          <div
                            className={`${sidebarStyles.optionRadio} ${optionStyle.radioClass}`}
                          >
                            {!showFeedback && isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                            {showFeedback &&
                              (isCorrect ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : isSelected ? (
                                <XCircle size={16} className="text-white" />
                              ) : null)}
                          </div>
                          <span
                            className={`${sidebarStyles.optionText} ${optionStyle.textClass}`}
                          >
                            {option}
                          </span>

                          {showFeedback && isCorrect && (
                            <span className={sidebarStyles.correctAnswerBadge}>
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation for review mode */}
                {reviewMode && (
                  <div className={sidebarStyles.explanationContainer}>
                    <div className={sidebarStyles.explanationHeader}>
                      <BarChart3
                        size={20}
                        className={sidebarStyles.explanationIcon}
                      />
                      <span className={sidebarStyles.explanationTitle}>
                        Explanation
                      </span>
                    </div>
                    <div className={sidebarStyles.explanationContent}>
                      <p className={sidebarStyles.explanationText}>
                        {answerFeedback.isCorrect
                          ? " Your answer is correct!"
                          : answerFeedback.userAnswer !== undefined &&
                              answerFeedback.userAnswer !== -1
                            ? ` Your answer was incorrect. The correct answer is option ${answerFeedback.correctAnswer + 1}.`
                            : ` This question was unattempted. The correct answer is option ${answerFeedback.correctAnswer + 1}.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className={sidebarStyles.navButtonsContainer}>
                <button
                  onClick={() => handleQuestionNavigation("prev")}
                  disabled={
                    currentQuestion === 0 || (!isQuizStarted && !reviewMode)
                  }
                  className={`${sidebarStyles.prevButton} ${
                    currentQuestion === 0 || (!isQuizStarted && !reviewMode)
                      ? sidebarStyles.prevButtonDisabled
                      : sidebarStyles.prevButtonEnabled
                  }`}
                >
                  <ArrowLeft size={18} />
                  <span>Previous Question</span>
                </button>

                <div className={sidebarStyles.navRightContainer}>
                  {!isSubmitted &&
                    !reviewMode &&
                    isQuizStarted &&
                    currentQuestion < questions.length - 1 && (
                      <button
                        onClick={() => {
                          setCurrentQuestion(currentQuestion + 1);
                        }}
                        className={sidebarStyles.nextButton}
                      >
                        <span>Next Question</span>
                        <ArrowRight size={18} />
                      </button>
                    )}

                  {/* Submit/Results button - Only show in quiz mode, not review mode */}
                  {questions.length > 0 && isQuizStarted && !reviewMode && (
                    <button
                      onClick={!isSignedIn ? openSignIn : handleSubmitQuiz} // Agar login nahi toh login modal, varna submit modal
                      className={`${sidebarStyles.submitButton} ${
                        isSubmitted
                          ? sidebarStyles.submitButtonResults
                          : sidebarStyles.submitButtonQuiz
                      } ${!isSignedIn ? "bg-amber-500" : ""}`}
                    >
                      {!isSignedIn
                        ? "Login to Submit"
                        : isSubmitted
                          ? "See Results"
                          : "Submit Quiz"}
                    </button>
                  )}

                  {/* In review mode, show "Back to Results" button */}
                  {reviewMode && (
                    <button
                      onClick={() => {
                        setReviewMode(false);
                        setShowResults(true);
                      }}
                      className={sidebarStyles.backToResultsButton}
                    >
                      Back to Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={sidebarStyles.loadingState}>
              <div className={sidebarStyles.loadingCard}>
                <div className={sidebarStyles.loadingSpinner} />
                <h3 className={sidebarStyles.loadingText}>
                  Preparing Your Quiz
                </h3>
                <p className={sidebarStyles.loadingSubtext}>
                  Loading questions and setting up timer...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      {showSubmitModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSubmitModal(false)}
          />

          {/* MODAL */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-105 animate-[scaleIn_0.25s_ease]">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-500" size={26} />
              <h3 className="text-xl font-semibold text-slate-800">
                Submit Quiz?
              </h3>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Once submitted, you cannot change your answers. Unattempted
              questions will be marked as incomplete.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              {/* ✅ FIXED BUTTON: Seedha confirmSubmit call hoga yahan */}
              <button
                onClick={confirmSubmit}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold shadow-md"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      {/* restart attention */}
      {showRestartModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRestartModal(false)}
          />

          {/* modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-105 animate-[scaleIn_0.25s_ease]">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={26} />
              <h3 className="text-xl font-semibold text-slate-800">
                Restart Quiz ?
              </h3>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              All your progress for this technology/level will be lost. Timer
              will start fresh from the beginning.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRestartModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowRestartModal(false);
                  confirmRestart();
                }}
                className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold shadow-md"
              >
                Restart Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      {/* login required for start quiz */}
      {showLoginModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />

          {/* modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-105 animate-[scaleIn_0.25s_ease]">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-amber-500" size={26} />
              <h3 className="text-xl font-semibold text-slate-800">
                Login Required
              </h3>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              Please login to start the quiz.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowLoginModal(false);
                  openSignIn();
                }}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold shadow-md"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* append existing cssStyles and our lightweight extraCss */}
      <style>{cssStyles + extraCss}</style>
    </div>
  );
};

export default SidebarCompo;
