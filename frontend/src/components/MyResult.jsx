import React, { useEffect, useMemo, useState } from "react";
import {
  resultPageStyles,
  getColorClass,
  colorClasses,
  getBadgeClasses,
  getBadgeText,
} from "../assets/dummyStyles.js";
import { useApi } from "../services/api.js";
import { resultPageAnimations } from './../assets/dummyStyles';

// Badge Component
const Badge = ({ percent }) => {
  const classes = getBadgeClasses(percent);
  const text = getBadgeText(percent);
  return <span className={classes}>{text}</span>;
};

// StripCard Component
function StripCard({ item, onToggle }) {
  const percent = item.totalQuestions
    ? Math.round((item.correct / item.totalQuestions) * 100)
    : 0;

  const colorKey = getColorClass(percent);
  const colors = colorClasses[colorKey] || colorClasses.red; //  safe fallback

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeTaken = (seconds) => {
    if (!seconds) return "0s";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return s ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <article onClick={onToggle} className={resultPageStyles.stripCard(colors)}>
      {/* Accent */}
      <div className={resultPageStyles.stripCardAccent(colors)} />

      {/* Content */}
      <div className="p-5">
        {/* TOP ROW */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={resultPageStyles.stripCardIconContainer(colors)}>
              <span className={resultPageStyles.stripCardIconText}>
                {item.title?.[0]}
              </span>
            </div>

            <div>
              <h3 className={resultPageStyles.stripCardTitle}>{item.title}</h3>
              <p className={resultPageStyles.stripCardSubtitle}>
                {item.totalQuestions} Questions
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={resultPageStyles.stripCardPercent(colors)}>
              {percent}%
            </div>
            <div className="mt-1">
              <Badge percent={percent} />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-4">
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

        {/* DATE + TIME */}
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
    </article>
  );
}

// Main Component
const MyResult = () => {
  const { request } = useApi();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadResults = async () => {
      const data = await request("/result/my-result");

      const formatted = data.map((r) => ({
        ...r,
        title: `${r.technology.toUpperCase()} ${
          r.level.charAt(0).toUpperCase() + r.level.slice(1)
        }`,
      }));

      setResults(formatted);
    };

    loadResults();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      const track = r.title.split(" ")[0];
      if (!map[track]) map[track] = [];
      map[track].push(r);
    });
    return map;
  }, [results]);

  return (
    <div className={resultPageStyles.container}>
      <div className={resultPageStyles.innerContainer}>
        {Object.entries(grouped).map(([track, items]) => (
          <section key={track} className="mb-8">
            {/* HEADER */}
            <div className="flex items-center mb-4">
              <div className="h-2 w-2 bg-indigo-500 rounded-full mr-2"></div>

              <h2 className="text-lg font-semibold text-gray-800">
                {track} Track
              </h2>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
              {items.map((r, index) => (
                <StripCard key={index} item={r} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <style jsx>{resultPageAnimations}</style>
    </div>
  );
};

export default MyResult;
