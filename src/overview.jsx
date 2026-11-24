import React, { useState, useId } from "react";
import { Activity, BookOpen, Trophy } from "lucide-react";
import { contributionDays, courseworkCoverage } from "../shared/metrics.js";

export function CommunityOverview({
  assignments,
  solvers,
  ranks,
  onAssignment,
  onLeaderboard,
}) {
  const [active, setActive] = useState(null);
  const days = contributionDays(solvers);
  const peak = Math.max(2, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const gradientId = useId();
  const point = (day, index) => [
    50 + (index * 850) / (days.length - 1),
    165 - (day.count / peak) * 125,
  ];
  const points = days
    .map((day, index) => point(day, index).join(","))
    .join(" ");
  const index = active ?? days.length - 1;
  const selected = days[index];
  const [x, y] = point(selected, index);
  return (
    <section className="community-overview" aria-label="Community overview">
      <article className="activity-panel panel">
        <div className="panel-heading">
          <div>
            <span className="panel-label">
              Contribution activity <Activity size={15} />
            </span>
            <div className="activity-total">
              {total}
              <span>solvers shared</span>
            </div>
          </div>
          <span className="period-label">Last 14 days · UTC</span>
        </div>
        <div className="chart-container">
          <svg
            className="activity-chart"
            viewBox="0 0 930 195"
            role="img"
            aria-label={`${total} solvers shared over the last 14 days. Use the date buttons below to inspect daily counts.`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <line
                  x1="50"
                  x2="900"
                  y1={165 - i * 62.5}
                  y2={165 - i * 62.5}
                  className="grid-line"
                />
                <text x="12" y={170 - i * 62.5} className="axis-label">
                  {Math.round((peak * i) / 2)}
                </text>
              </g>
            ))}
            <polygon
              points={`50,165 ${points} 900,165`}
              fill={`url(#${gradientId})`}
            />
            <polyline points={points} fill="none" className="chart-line" />
            <line x1={x} x2={x} y1="25" y2="175" className="chart-crosshair" />
            <circle cx={x} cy={y} r="5" className="chart-dot" />
          </svg>
          <div className="chart-readout" aria-live="polite">
            <span>{selected.label}</span>
            <strong>
              {selected.count} {selected.count === 1 ? "solver" : "solvers"}
            </strong>
          </div>
        </div>
        <div className="chart-dates" aria-label="Daily contribution counts">
          {days.map((day, i) => (
            <button
              key={day.key}
              className={i === index ? "selected" : ""}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={i === index}
              aria-label={`${day.label}: ${day.count} solvers`}
            >
              {day.label}
            </button>
          ))}
        </div>
        {total === 0 && (
          <p className="chart-note">
            No new solvers in this period. Your next contribution can get things
            moving.
          </p>
        )}
      </article>
      <div className="overview-bottom">
        <article className="panel coursework-panel">
          <div className="panel-heading">
            <span className="panel-label">
              <BookOpen size={16} /> Coursework coverage
            </span>
            <span className="period-label">Questions with a solver</span>
          </div>
          {assignments.length ? (
            <div className="coverage-list">
              {assignments
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 4)
                .map((a) => {
                  const coverage = courseworkCoverage(a, solvers);
                  return (
                    <button
                      className="coverage-row"
                      key={a.id}
                      onClick={() => onAssignment(a.id)}
                    >
                      <div>
                        <strong>{a.title}</strong>
                        <span>
                          {coverage.covered} / {a.questionCount} questions
                        </span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${coverage.percent}%` }} />
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="panel-empty">
              <BookOpen size={22} />
              <p>
                Coursework will appear here when the admin creates an
                assignment.
              </p>
            </div>
          )}
        </article>
        <article className="panel contributors-panel">
          <div className="panel-heading">
            <span className="panel-label">
              <Trophy size={16} /> Top contributors
            </span>
            <button className="text-button" onClick={onLeaderboard}>
              View all
            </button>
          </div>
          {ranks.length ? (
            ranks.slice(0, 3).map((r, i) => (
              <div className="contributor-row" key={r.id}>
                <span className="position">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="avatar">
                  {r.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <strong>{r.name}</strong>
                <span>
                  {r.count} {r.count === 1 ? "solver" : "solvers"}
                </span>
              </div>
            ))
          ) : (
            <div className="panel-empty">
              <Trophy size={22} />
              <p>
                Every contribution counts. Share a solver to join the
                leaderboard.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
