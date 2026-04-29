import React, { useState, useEffect, useRef } from "react";
import { useApi } from "../services/api.js";
import { Users } from "lucide-react";
import { dashboardStyles } from "../assets/dummyStyles.jsx";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Upload,
  BarChart,
  XCircle,
} from "lucide-react";

const levels = [
  { value: "Basic", color: "text-green-600", bg: "bg-green-50" },
  { value: "Intermediate", color: "text-yellow-600", bg: "bg-yellow-50" },
  { value: "Advanced", color: "text-red-600", bg: "bg-red-50" },
];

const DashboardCompo = () => {
  const [technology, setTechnology] = useState("");
  const [level, setLevel] = useState("Basic");
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalLoggedIn: 0,
    loggedInPercentage: 0,
  });

  const { request } = useApi();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await request("/admin/stats");
        setAdminStats({
          totalUsers: data.totalUsers || 0,
          totalLoggedIn: data.loggedInUsers || 0,
          loggedInPercentage: data.loggedInPercentage || 0,
        });
      } catch (err) {
        console.log("Stats error:", err);
      }
    };

    loadStats();
  }, [request]);

  const letterForIndex = (i) => ["A", "B", "C", "D"][i] || "";

  const isFormValid =
    technology.trim() !== "" && level && timeLimit && questions.length > 0;

const handleSubmit = async () => {
  if (!isFormValid) return;

  try {
    const payload = {
      technology: technology.trim(),
      level,
      timeLimit: Number(timeLimit),
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        answerKey: q.answerKey,
      })),
    };

    console.log("📦 Sending payload:", payload);

    // ✅ FIXED CALL
    const res = await request(
      "/admin/upload-quiz",
      "POST",
      payload
    );

    console.log("✅ SUCCESS RESPONSE:", res);

    setToast({
      show: true,
      type: "success",
      message: "Quiz created successfully",
    });

    setTechnology("");
    setLevel("Basic");
    setTimeLimit(30);
    setQuestions([]);
  } catch (err) {
    console.log("🔥 ERROR:", err);

    setToast({
      show: true,
      type: "error",
      message:
        err?.message || "Failed to create quiz",
    });
  }
};

  const handleDragOver = (e) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = () => {
  setIsDragging(false);
};

const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);

  const file = e.dataTransfer.files[0];
  if (file && file.type === "text/csv") {
    handleFileUpload({ target: { files: [file] } });
  } else {
    setValidationErrors((prev) => ({
      ...prev,
      questions: "Please upload a valid CSV file",
    }));
  }
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== "text/csv") {
    setValidationErrors((prev) => ({
      ...prev,
      questions: "Only CSV files are allowed",
    }));
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target.result;

    const rows = text.split("\n").slice(1);

    const parsed = rows
      .map((row) => {
        const cols = row.split(",");

        if (cols.length < 6) return null;

        return {
          question: cols[0],
          options: [cols[1], cols[2], cols[3], cols[4]],
          answerKey: cols[5]?.trim(),
        };
      })
      .filter(Boolean);

    setQuestions(parsed);
    setValidationErrors((prev) => ({ ...prev, questions: "" }));
  };

  reader.readAsText(file);
};

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.headerWrapper}>
          <div className={dashboardStyles.headerInner}>
            <div>
              <h1 className={dashboardStyles.title}>Tech Quiz Master</h1>
            </div>
          </div>
        </div>

        <div className={dashboardStyles.grid}>
          <div className={dashboardStyles.mainColumn}>
            <div className={dashboardStyles.card}>
              <h2 className={dashboardStyles.cardTitle}>Create Quiz</h2>

              <div className={dashboardStyles.formFields}>
                <div>
                  <label className={dashboardStyles.label}>
                    Technology Name*
                  </label>

                  <input
                    type="text"
                    value={technology}
                    onChange={(e) => {
                      setTechnology(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        technology: "",
                      }));
                    }}
                    placeholder="e.g., Javascript, React, Python"
                    className={`${dashboardStyles.inputBase} ${
                      validationErrors.technology
                        ? dashboardStyles.inputErrorBorder
                        : dashboardStyles.inputNormalBorder
                    }`}
                  />

                  {validationErrors.technology && (
                    <p className={dashboardStyles.errorMessage}>
                      <AlertCircle className={dashboardStyles.errorIcon} />
                      {validationErrors.technology}
                    </p>
                  )}
                </div>

                <div>
                  <label className={dashboardStyles.label}>
                    Difficulty Level*
                  </label>

                  <div className={dashboardStyles.levelGrid}>
                    {levels.map((lvl) => (
                      <button
                        key={lvl.value}
                        onClick={() => {
                          setLevel(lvl.value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            level: "",
                          }));
                        }}
                        className={`${dashboardStyles.levelButtonBase} ${
                          level === lvl.value
                            ? `${lvl.bg} border-2 ${lvl.color.replace(
                                "text",
                                "border",
                              )}`
                            : "border-gray-200"
                        }`}
                      >
                        <span
                          className={`${dashboardStyles.levelButtonTextBase} ${lvl.color}`}
                        >
                          {lvl.value}
                        </span>
                      </button>
                    ))}
                  </div>

                  {validationErrors.level && (
                    <p className={dashboardStyles.errorMessage}>
                      <AlertCircle className={dashboardStyles.errorIcon} />
                      {validationErrors.level}
                    </p>
                  )}
                </div>

                <div>
                  <label className={dashboardStyles.label}>
                    Time Limit (Minutes)*
                  </label>

                  <div className={dashboardStyles.timeContainer}>
                    <div className={dashboardStyles.timeInputWrapper}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={timeLimit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d+$/.test(value)) {
                            setTimeLimit(value);
                            setValidationErrors((prev) => ({
                              ...prev,
                              timeLimit: "",
                            }));
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setTimeLimit(30);
                          }
                        }}
                        className={`${dashboardStyles.timeInputBase} ${
                          validationErrors.timeLimit
                            ? dashboardStyles.inputErrorBorder
                            : dashboardStyles.inputNormalBorder
                        }`}
                        placeholder="Enter time in minutes"
                      />
                    </div>

                    <div className={dashboardStyles.timeDisplay}>
                      {timeLimit} min
                    </div>

                    <div className={dashboardStyles.timeHint}>
                      <AlertCircle className={dashboardStyles.timeHintIcon} />
                      <span>
                        Time allocated per participant to complete the quiz
                      </span>
                    </div>
                  </div>

                  {validationErrors.timeLimit && (
                    <p className={dashboardStyles.errorMessage}>
                      <AlertCircle className={dashboardStyles.errorIcon} />
                      {validationErrors.timeLimit}
                    </p>
                  )}
                </div>

                <div>
                  <label className={dashboardStyles.label}>
                    Upload Questions CSV *
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`${dashboardStyles.dropzoneBase} ${
                      isDragging
                        ? dashboardStyles.dropzoneDragging
                        : validationErrors.questions
                          ? dashboardStyles.dropzoneError
                          : dashboardStyles.dropzoneNormal
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        fileInputRef.current?.click();
                    }}
                    aria-label="Upload questions CSV"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className={dashboardStyles.hiddenInput}
                    />
                    <Upload
                      className={`${dashboardStyles.uploadIconBase} ${
                        isDragging
                          ? dashboardStyles.uploadIconDragging
                          : dashboardStyles.uploadIconNormal
                      }`}
                    />
                    <p className={dashboardStyles.dropzoneTextPrimary}>
                      {isDragging
                        ? "Drop your CSV file here"
                        : "Drag & drop or click to upload"}
                    </p>
                    <p className={dashboardStyles.dropzoneTextSecondary}>
                      Supports CSV files with Question, 4 Options, and Correct
                      Answer (A/B/C/D or exact text)
                    </p>
                  </div>
                  {validationErrors.questions && (
                    <p className={dashboardStyles.errorMessage}>
                      <AlertCircle className={dashboardStyles.errorIcon} />
                      {validationErrors.questions}
                    </p>
                  )}

                  {questions.length > 0 && (
                    <div className={dashboardStyles.successContainer}>
                      <div className={dashboardStyles.successInner}>
                        <div className={dashboardStyles.successLeft}>
                          <CheckCircle
                            className={dashboardStyles.successIcon}
                          />
                          <div>
                            <p className={dashboardStyles.successText}>
                              {questions.length} questions loaded
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className={dashboardStyles.previewToggleButton}
                        >
                          {showPreview ? (
                            <EyeOff className={dashboardStyles.previewIcon} />
                          ) : (
                            <Eye className={dashboardStyles.previewIcon} />
                          )}
                          {showPreview ? "Hide Preview" : "Show Preview"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`${dashboardStyles.submitBase} ${isFormValid ? dashboardStyles.submitValid : dashboardStyles.submitInvalid}`}
                  >
                    {isFormValid ? (
                      <div className={dashboardStyles.submitInner}>
                        Create Quiz
                        <ChevronRight className={dashboardStyles.submitIcon} />
                      </div>
                    ) : (
                      "Fill All Fields to continue.."
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/*to preview questions */}
            {showPreview && questions.length > 0 && (
              <div className={dashboardStyles.previewCard}>
                <div className={dashboardStyles.previewHeader}>
                  <div>
                    <h3 className={dashboardStyles.previewTitle}>
                      Questions Preview
                    </h3>
                    <p className={dashboardStyles.previewSubtitle}>
                      Review all questions before creating quiz...!
                    </p>
                  </div>
                  <div className={dashboardStyles.previewRight}>
                    <div className={dashboardStyles.timeBadge}>
                      <Clock className={dashboardStyles.timeBadgeIcon} />
                      <span className={dashboardStyles.timeBadgeText}>
                        {timeLimit} min total
                      </span>
                    </div>
                    <span className={dashboardStyles.countBadge}>
                      {questions.length} questions
                    </span>
                  </div>
                </div>
                <div className={dashboardStyles.previewList}>
                  {questions.map((q, idx) => (
                    <div key={idx} className={dashboardStyles.previewItem}>
                      <div className="flex items-start gap-3">
                        <div className={dashboardStyles.previewNumber}>
                          {idx + 1}
                        </div>
                        <div className={dashboardStyles.previewContent}>
                          <div className="mb-3">
                            <h4 className={dashboardStyles.previewQuestion}>
                              {q.question}
                            </h4>
                          </div>

                          <div className={dashboardStyles.optionsGrid}>
                            {q.options.map((opt, oi) => {
                              const letter = letterForIndex(oi);
                              const isCorrect = q.answerKey === letter;
                              return (
                                <div
                                  key={oi}
                                  className={`${dashboardStyles.optionItemBase} ${
                                    isCorrect
                                      ? dashboardStyles.optionItemCorrect
                                      : dashboardStyles.optionItemIncorrect
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`${dashboardStyles.optionLetterBase} ${
                                        isCorrect
                                          ? dashboardStyles.optionLetterCorrect
                                          : dashboardStyles.optionLetterIncorrect
                                      }`}
                                    >
                                      {letter}
                                    </div>
                                    <span
                                      className={
                                        isCorrect
                                          ? dashboardStyles.optionTextCorrect
                                          : dashboardStyles.optionTextIncorrect
                                      }
                                    >
                                      {opt || (
                                        <span
                                          className={
                                            dashboardStyles.optionEmptyText
                                          }
                                        >
                                          Empty option
                                        </span>
                                      )}
                                    </span>
                                    {isCorrect && (
                                      <div
                                        className={dashboardStyles.correctIcon}
                                      >
                                        <CheckCircle
                                          className={
                                            dashboardStyles.correctIconSvg
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className={dashboardStyles.optionFooter}>
                            <div className={dashboardStyles.answerBadge}>
                              <CheckCircle
                                className={dashboardStyles.answerBadgeIcon}
                              />
                              <span className={dashboardStyles.answerBadgeText}>
                                Correct Answer: {q.answerKey}
                              </span>
                            </div>
                            <div className={dashboardStyles.positionText}>
                              Question {idx + 1} of {questions.length}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={dashboardStyles.rightColumn}>
                  {/* Total Users */}
                  <div className={dashboardStyles.summaryCard}>
                    <h3 className={dashboardStyles.summaryTitle}>
                      👥 Platform Stats
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={dashboardStyles.summaryLabel}>
                          Total Registered Users
                        </span>

                        <div className="flex items-center gap-2">
                          <Users className={dashboardStyles.summaryIcon} />
                          <span className={dashboardStyles.summaryValue}>
                            {adminStats.totalUsers}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={dashboardStyles.summaryLabel}>
                          Total Logged In Users
                        </span>

                        <div className="flex items-center gap-2">
                          <CheckCircle
                            className={dashboardStyles.summaryIcon}
                          />
                          <span className={dashboardStyles.summaryValue}>
                            {adminStats.totalLoggedIn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={dashboardStyles.summaryLabel}>
                          Login Rate
                        </span>

                        <div className="flex items-center gap-2">
                          <BarChart className={dashboardStyles.summaryIcon} />
                          <span className="text-green-600 font-semibold">
                            {adminStats.loggedInPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={dashboardStyles.tipsCard}>
                    <h3 className={dashboardStyles.tipsTitle}>🚀 Quick Tips</h3>
                    <ul className={dashboardStyles.tipsList}>
                      <li className={dashboardStyles.tipsItem}>
                        <div className={dashboardStyles.tipsNumber}>1</div>
                        <span className={dashboardStyles.tipsText}>
                          All fields marked with * are required
                        </span>
                      </li>
                      <li className={dashboardStyles.tipsItem}>
                        <div className={dashboardStyles.tipsNumber}>2</div>
                        <span className={dashboardStyles.tipsText}>
                          Preview questions before creating quiz
                        </span>
                      </li>
                      <li className={dashboardStyles.tipsItem}>
                        <div className={dashboardStyles.tipsNumber}>3</div>
                        <span className={dashboardStyles.tipsText}>
                          Set appropriate time limit based on difficulty level
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className={dashboardStyles.summaryCard}>
                    <h3 className={dashboardStyles.summaryTitle}>
                      📊 Quiz Summary
                    </h3>
                    <div className={dashboardStyles.summaryRows}>
                      <div className={dashboardStyles.summaryRow}>
                        <span className={dashboardStyles.summaryLabel}>
                          Technology:
                        </span>
                        <span className={dashboardStyles.summaryValue}>
                          {technology || "—"}
                        </span>
                      </div>
                      <div className={dashboardStyles.summaryRow}>
                        <span className={dashboardStyles.summaryLabel}>
                          Level:
                        </span>
                        <span
                          className={`${dashboardStyles.summaryValue} ${
                            level === "Basic"
                              ? "text-green-600"
                              : level === "Intermediate"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {level}
                        </span>
                      </div>
                      <div className={dashboardStyles.summaryRow}>
                        <span className={dashboardStyles.summaryLabel}>
                          Time Limit:
                        </span>
                        <div className="flex items-center gap-2">
                          <Clock className={dashboardStyles.summaryIcon} />
                          <span className={dashboardStyles.summaryValue}>
                            {timeLimit} minutes
                          </span>
                        </div>
                      </div>
                      <div className={dashboardStyles.summaryRow}>
                        <span className={dashboardStyles.summaryLabel}>
                          Total Questions:
                        </span>
                        <span className={dashboardStyles.summaryValue}>
                          {questions.length}
                        </span>
                      </div>
                      <div className={dashboardStyles.summaryStatusRow}>
                        <span className={dashboardStyles.summaryLabel}>
                          Status:
                        </span>
                        <span
                          className={`${dashboardStyles.statusBadgeBase} ${
                            isFormValid
                              ? dashboardStyles.statusBadgeReady
                              : dashboardStyles.statusBadgeIncomplete
                          }`}
                        >
                          {isFormValid ? "Ready" : "Incomplete"}
                        </span>
                      </div>
                    </div>

                    <div className={dashboardStyles.previewList}>
                      {questions.map((q, idx) => (
                        <div key={idx} className={dashboardStyles.previewItem}>
                          <div className="flex items-start gap-3">
                            <div className={dashboardStyles.previewNumber}>
                              {idx + 1}
                            </div>
                            <div className={dashboardStyles.previewContent}>
                              <div className="mb-3">
                                <h4 className={dashboardStyles.previewQuestion}>
                                  {q.question}
                                </h4>
                              </div>

                              <div className={dashboardStyles.optionsGrid}>
                                {q.options.map((opt, oi) => {
                                  const letter = letterForIndex(oi);
                                  const isCorrect = q.answerKey === letter;
                                  return (
                                    <div
                                      key={oi}
                                      className={`${dashboardStyles.optionItemBase} ${
                                        isCorrect
                                          ? dashboardStyles.optionItemCorrect
                                          : dashboardStyles.optionItemIncorrect
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`${dashboardStyles.optionLetterBase} ${
                                            isCorrect
                                              ? dashboardStyles.optionLetterCorrect
                                              : dashboardStyles.optionLetterIncorrect
                                          }`}
                                        >
                                          {letter}
                                        </div>
                                        <span
                                          className={
                                            isCorrect
                                              ? dashboardStyles.optionTextCorrect
                                              : dashboardStyles.optionTextIncorrect
                                          }
                                        >
                                          {opt || (
                                            <span
                                              className={
                                                dashboardStyles.optionEmptyText
                                              }
                                            >
                                              Empty option
                                            </span>
                                          )}
                                        </span>
                                        {isCorrect && (
                                          <div
                                            className={
                                              dashboardStyles.correctIcon
                                            }
                                          >
                                            <CheckCircle
                                              className={
                                                dashboardStyles.correctIconSvg
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className={dashboardStyles.optionFooter}>
                                <div className={dashboardStyles.answerBadge}>
                                  <CheckCircle
                                    className={dashboardStyles.answerBadgeIcon}
                                  />
                                  <span
                                    className={dashboardStyles.answerBadgeText}
                                  >
                                    Correct Answer: {q.answerKey}
                                  </span>
                                </div>
                                <div className={dashboardStyles.positionText}>
                                  Question {idx + 1} of {questions.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={dashboardStyles.rightColumn}>
            {/* Total Users */}
            <div className={dashboardStyles.summaryCard}>
              <h3 className={dashboardStyles.summaryTitle}>
                👥 Platform Stats
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={dashboardStyles.summaryLabel}>
                    Total Registered Users
                  </span>

                  <div className="flex items-center gap-2">
                    <Users className={dashboardStyles.summaryIcon} />
                    <span className={dashboardStyles.summaryValue}>
                      {adminStats.totalUsers}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={dashboardStyles.summaryLabel}>
                    Total Logged In Users
                  </span>

                  <div className="flex items-center gap-2">
                    <CheckCircle className={dashboardStyles.summaryIcon} />
                    <span className={dashboardStyles.summaryValue}>
                      {adminStats.totalLoggedIn}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={dashboardStyles.summaryLabel}>
                    Login Rate
                  </span>

                  <div className="flex items-center gap-2">
                    <BarChart className={dashboardStyles.summaryIcon} />
                    <span className="text-green-600 font-semibold">
                      {adminStats.loggedInPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.tipsCard}>
              <h3 className={dashboardStyles.tipsTitle}>🚀 Quick Tips</h3>
              <ul className={dashboardStyles.tipsList}>
                <li className={dashboardStyles.tipsItem}>
                  <div className={dashboardStyles.tipsNumber}>1</div>
                  <span className={dashboardStyles.tipsText}>
                    All fields marked with * are required
                  </span>
                </li>
                <li className={dashboardStyles.tipsItem}>
                  <div className={dashboardStyles.tipsNumber}>2</div>
                  <span className={dashboardStyles.tipsText}>
                    Preview questions before creating quiz
                  </span>
                </li>
                <li className={dashboardStyles.tipsItem}>
                  <div className={dashboardStyles.tipsNumber}>3</div>
                  <span className={dashboardStyles.tipsText}>
                    Set appropriate time limit based on difficulty level
                  </span>
                </li>
              </ul>
            </div>

            <div className={dashboardStyles.summaryCard}>
              <h3 className={dashboardStyles.summaryTitle}>📊 Quiz Summary</h3>
              <div className={dashboardStyles.summaryRows}>
                <div className={dashboardStyles.summaryRow}>
                  <span className={dashboardStyles.summaryLabel}>
                    Technology:
                  </span>
                  <span className={dashboardStyles.summaryValue}>
                    {technology || "—"}
                  </span>
                </div>
                <div className={dashboardStyles.summaryRow}>
                  <span className={dashboardStyles.summaryLabel}>Level:</span>
                  <span
                    className={`${dashboardStyles.summaryValue} ${
                      level === "Basic"
                        ? "text-green-600"
                        : level === "Intermediate"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {level}
                  </span>
                </div>
                <div className={dashboardStyles.summaryRow}>
                  <span className={dashboardStyles.summaryLabel}>
                    Time Limit:
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className={dashboardStyles.summaryIcon} />
                    <span className={dashboardStyles.summaryValue}>
                      {timeLimit} minutes
                    </span>
                  </div>
                </div>
                <div className={dashboardStyles.summaryRow}>
                  <span className={dashboardStyles.summaryLabel}>
                    Total Questions:
                  </span>
                  <span className={dashboardStyles.summaryValue}>
                    {questions.length}
                  </span>
                </div>
                <div className={dashboardStyles.summaryStatusRow}>
                  <span className={dashboardStyles.summaryLabel}>Status:</span>
                  <span
                    className={`${dashboardStyles.statusBadgeBase} ${
                      isFormValid
                        ? dashboardStyles.statusBadgeReady
                        : dashboardStyles.statusBadgeIncomplete
                    }`}
                  >
                    {isFormValid ? "Ready" : "Incomplete"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Toast */}
      {toast.show && (
        <div
          className={`${dashboardStyles.toastOuter} ${
            toast.show
              ? dashboardStyles.toastVisible
              : dashboardStyles.toastHidden
          }`}
        >
          <div
            className={`${dashboardStyles.toastInner} ${
              toast.type === "success"
                ? dashboardStyles.toastSuccess
                : toast.type === "error"
                  ? dashboardStyles.toastError
                  : dashboardStyles.toastInfo
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === "success" ? (
                <CheckCircle className={dashboardStyles.toastIconSuccess} />
              ) : toast.type === "error" ? (
                <XCircle className={dashboardStyles.toastIconError} />
              ) : (
                <AlertCircle className={dashboardStyles.toastIconInfo} />
              )}
              <div className="flex-1">
                <p
                  className={`${dashboardStyles.toastTextBase} ${
                    toast.type === "success"
                      ? dashboardStyles.toastTextSuccess
                      : toast.type === "error"
                        ? dashboardStyles.toastTextError
                        : dashboardStyles.toastTextInfo
                  }`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                className={dashboardStyles.toastCloseButton}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCompo;
