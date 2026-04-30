import React, { useEffect, useMemo, useState } from "react";
import {
  resultPageStyles,
  resultPageAnimations,
  getColorClass,
  colorClasses,
  getBadgeClasses,
  getBadgeText,
} from "../assets/dummyStyles.js";
import { useApi } from "../services/api.js";

//small component
const Badge = ({ percent }) => {
  const classes = getBadgeClasses(percent);
  const text = getBadgeText(percent);

  return <span className={classes}>{text} </span>;
};

//stripCard
function StripCard({ item, open, onToggle }) {
  const percent = item.totalQuestions
    ? Math.round((item.correct / item.totalQuestions) * 100)
    : 0;

  const colorKey = getColorClass(percent);
  const colors = colorClasses[colorKey];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };
  const formatTimeTaken = (seconds) => {
    if (!seconds || seconds <= 0) return "0s";

    // Less than 1 minute
    if (seconds < 60) {
      return `${seconds}s`;
    }

    // Less than 1 hour
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;

      if (secs === 0) return `${mins}m`;
      return `${mins}m ${secs}s`;
    }

    // 1 hour or more
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours}h ${mins}m ${secs}s`; // output is in hh-mm-ss
  };
  return (
    <article onClick={onToggle} className={resultPageStyles.stripCard(colors)}>
      <div className={resultPageStyles.stripCardAccent(colors)}></div>
      <div className={resultPageStyles.stripCardIconContainer}>
        <div className={resultPageStyles.stripCardTopRow}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={resultPageStyles.stripCardIconContainer(colors)}>
              <span className={resultPageStyles.stripCardIconText}>
                {item.title.split(" ")[1]?.[0] || item.title[0]}
              </span>
            </div>
            <div className={resultPageStyles.stripCardPercentContainer}>
              <h3 className={resultPageStyles.stripCardTitle}></h3>
              <div className={resultPageStyles.stripCardSubtitle}>
                {item.totalQuestions} Questions
              </div>
            </div>
          </div>
          <div className={resultPageStyles.stripCardPercentContainer}>
            <div className={resultPageStyles.stripCardPercent(colors)}>
              {percent}%
              <div className={resultPageStyles.stripCardBadgeContainer}>
                <Badge percent={percent} />
              </div>
            </div>
          </div>
          <div className={resultPageStyles.stripCardStatsRow}>
            <div className={resultPageStyles.stripCardStat(true, colors)}>
              <div className={resultPageStyles.stripCardStatNumber}>
                {item.correct}
              </div>
              <div className={resultPageStyles.stripCardStatLabel}>Correct</div>
            </div>
            <div className={resultPageStyles.stripCardStat(false, colors)}>
              <div className={resultPageStyles.stripCardStatNumber}>
                {item.wrong}
              </div>
              <div className={resultPageStyles.stripCardStatLabel}>Wrong</div>
            </div>
            <div className={resultPageStyles.stripCardStat(false, colors)}>
              <div className={resultPageStyles.stripCardStatNumber}>
                {item.totalQuestions - item.correct - item.wrong}
              </div>
              <div className={resultPageStyles.stripCardStatLabel}>
                Unattempted
              </div>
            </div>
          </div>

          <div className={resultPageStyles.stripCardDateTimeSection}>
            <div className={resultPageStyles.stripCardDateTimeGrid}>
              <div className={resultPageStyles.stripCardDateBox}>
                <div
                  className={`${resultPageStyles.stripCardDateTimeLabel} ${resultPageStyles.stripCardDateLabel}`}
                >
                  Date
                </div>
                <div
                  className={`${resultPageStyles.stripCardDateTimeValue} ${resultPageStyles.stripCardDateValue}`}
                >
                  {formatDate(item.startDate).split(",")[0]}
                </div>
              </div>
              <div className={resultPageStyles.stripCardTimeBox}>
                <div
                  className={`${resultPageStyles.stripCardDateTimeLabel} ${resultPageStyles.stripCardTimeLabel}`}
                >
                  Time Taken
                </div>
                <div
                  className={`${resultPageStyles.stripCardDateTimeValue} ${resultPageStyles.stripCardTimeValue}`}
                >
                  {formatTimeTaken(item.timeTaken)}
                </div>
              </div>
            </div>
            <div className={resultPageStyles.stripCardStartedAtBox}>
              <div className={resultPageStyles.stripCardStartedAtLabel}>
                Started At
              </div>
              <div className={resultPageStyles.stripCardStartedAtValue}>
                {formatDate(item.startDate).split(",")[1]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const MyResult = () => {
  const { request } = useApi();
  const [results, setResults] = useState([]);

  const makeKey = (r) => `${r.id}||${r.title}`;
  const [openStates, setOpenStates] = useState(() =>
    results.reduce((acc, r) => ({ ...acc, [makeKey(r)]: false }), {}),
  );
  const [showAll, setShowAll] = useState(false);

  const toggle = (k) => setOpenStates((s) => ({ ...s, [k]: !s[k] }));
  const toggleAll = () => {
    const to = !showAll;
    setShowAll(to);
    setOpenStates(
      results.reduce((acc, r) => ({ ...acc, [makeKey(r)]: to }), {}),
    );
  };

  const summary = useMemo(() => {
    const totalQs = results.reduce((s, r) => s + (r.totalQuestions || 0), 0);
    const totalCorrect = results.reduce((s, r) => s + (r.correct || 0), 0);
    const totalWrong = results.reduce((s, r) => s + (r.wrong || 0), 0);
    const totalTimeTaken = results.reduce((s, r) => s + (r.timeTaken || 0), 0);
    const pct = totalQs ? Math.round((totalCorrect / totalQs) * 100) : 0;
    return { totalQs, totalCorrect, totalWrong, totalTimeTaken, pct };
  }, [results]);
  // call real API to fetch results on component mount
  useEffect(() => {
    const loadResults = async () => {
      const data = await request("/result/my-result");

      const formatted = data.map((r) => ({
        ...r,
        title: `${r.technology.toUpperCase()} ${r.level.charAt(0).toUpperCase() + r.level.slice(1)}`,
      }));

      setResults(formatted);
    };

    loadResults();
  }, []);

  const { headingTitle } = useMemo(() => {
    const tracks = Array.from(
      new Set(
        results.map((r) => (r.title || "").split(" ")[0]).filter(Boolean),
      ),
    );
    let headingTitle = "Quiz Results";
    if (tracks.length === 1) {
      headingTitle = `Quiz Results — ${tracks[0]} Track`;
    } else if (tracks.length === 2) {
      headingTitle = `Quiz Results — ${tracks.join(" & ")} Tracks`;
    } else if (tracks.length > 2) {
      headingTitle = `Quiz Results — Multiple Tracks`;
    }
    return { headingTitle };
  }, [results]);

  const grouped = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      const track = (r.title || "").split(" ")[0] || "General";
      if (!map[track]) map[track] = [];
      map[track].push(r);
    });
    return map;
  }, [results]);

  return (
    <div className={resultPageStyles.container}>
      <div className={resultPageStyles.innerContainer}>
        <header className={resultPageStyles.header}>
          <div className={resultPageStyles.headerBox}>
            <h1 className={resultPageStyles.headerTitle}>{headingTitle}</h1>
          </div>
        </header>
        {Object.entries(grouped).map(([track, items]) => (
          <section key={track} className={resultPageStyles.trackSection}>
            <div className={resultPageStyles.trackHeader}>
              <h2 className={resultPageStyles.trackTitle}>{track}Track</h2>
            </div>
            <div className={resultPageStyles.cardsGrid}>
              {items.map((r, index) => {
                const key =
                  makeKey(r) && !makeKey(r).startsWith("undefined")
                    ? makeKey(r)
                    : `${r?.title || "item"}-${index}`;

                return (
                  <StripCard
                    key={key}
                    item={r}
                    open={!!openStates[key]}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default MyResult;
