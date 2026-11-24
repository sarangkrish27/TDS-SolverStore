import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Search,
  Plus,
  ArrowUpRight,
  Code2,
  Trophy,
  LayoutGrid,
  Layers,
  Flag,
  X,
  LogOut,
  ExternalLink,
  Check,
  Clock,
  Link as LinkIcon,
  Users,
  Menu,
  ChevronRight,
  Settings,
  Inbox,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
} from "lucide-react";
import {
  initializeFirebase,
  subscribe,
  watchAuth,
  login,
  logout,
  action,
} from "./data";
import { CommunityOverview } from "./overview";
import "./dashboard.css";
const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const date = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("tds-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("tds-theme", theme);
    } catch {}
  }, [theme]);
  const [data, setData] = useState({ assignments: [], solvers: [] }),
    [user, setUser] = useState(null),
    [view, setView] = useState("browse"),
    [selected, setSelected] = useState("all"),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [question, setQuestion] = useState("all"),
    [sort, setSort] = useState("newest"),
    [modal, setModal] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [issues, setIssues] = useState([]),
    [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(false);
  useEffect(
    () =>
      subscribe(
        (value) => {
          setData(value);
          setLoading(false);
        },
        (e) => {
          setError(
            e.message ||
              "Could not load data. Check Firebase configuration and Firestore rules.",
          );
          setLoading(false);
        },
      ),
    [],
  );
  useEffect(() => watchAuth(setUser), []);
  const [adminUid, setAdminUid] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let request = 0;
    setAdminUid(null);
    function refreshAdmin() {
      if (!user) return;
      const current = ++request;
      action("session")
        .then((session) => {
          if (!cancelled && current === request) setAdminUid(session.isAdmin ? user.uid : null);
        })
        .catch((e) => {
          if (!cancelled && current === request) {
            setAdminUid(null);
            setError(e.message);
          }
        });
    }
    function onVisible() {
      if (document.visibilityState === "visible") refreshAdmin();
    }
    refreshAdmin();
    window.addEventListener("focus", refreshAdmin);
    document.addEventListener("visibilitychange", onVisible);
    const timer = user ? setInterval(onVisible, 30000) : null;
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", refreshAdmin);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (view === "issues" && user)
      action("issues")
        .then((r) => setIssues(r.items))
        .catch((e) => setError(e.message));
  }, [view, user]);
  const admin = Boolean(user && adminUid === user.uid);
  const ranks = Object.values(
    data.solvers.reduce((all, s) => {
      all[s.creatorId] ??= { id: s.creatorId, name: s.creatorName, count: 0 };
      all[s.creatorId].count++;
      return all;
    }, {}),
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const assignment = data.assignments.find((a) => a.id === selected);
  const solvers = data.solvers
    .filter(
      (s) =>
        (selected === "all" || s.assignmentId === selected) &&
        (type === "all" ||
          data.assignments.find((a) => a.id === s.assignmentId)?.type ===
            type) &&
        (question === "all" || s.question === Number(question)) &&
        (view !== "mine" || s.creatorId === user?.uid) &&
        `${s.title} ${s.creatorName} ${data.assignments.find((a) => a.id === s.assignmentId)?.title} question ${s.question}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : new Date(b.createdAt) - new Date(a.createdAt),
    );
  function open(value) {
    setError("");
    setModal(value);
  }
  function gated(value) {
    open(user ? value : { kind: "login" });
  }
  function nav(next, id = "all") {
    setView(next);
    setSelected(id);
    setQuestion("all");
    setMobile(false);
    setQuery("");
  }
  async function submit(event, kind, extra = {}) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...Object.fromEntries(new FormData(event.currentTarget)),
        ...extra,
      };
      if (kind === "assignment" && payload.deadline)
        payload.deadline = new Date(payload.deadline).toISOString();
      await action(kind, payload);
      if (kind === "resolve") setIssues((await action("issues")).items);
      setModal(null);
      setToast(
        kind === "report"
          ? "Issue submitted. The creator can view it in their inbox."
          : "Saved successfully.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      setUser(await login());
      setModal(null);
      setToast("You’re signed in. Welcome to TDS SolverStore.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const totalQuestions = data.assignments.reduce(
    (n, a) => n + a.questionCount,
    0,
  );
  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobile ? "show" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav("browse");
          }}
        >
          <span className="brand-icon">
            <Code2 size={25} />
          </span>
          <span>
            TDS <span className="brand-light">SolverStore</span>
          </span>
        </a>
        <button
          className="collapse-nav icon-button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
        <label className="sidebar-search">
          <Search size={16} />
          <input
            aria-label="Search the library"
            placeholder="Search library…"
            value={query}
            onChange={(e) => {
              setView("browse");
              setSelected("all");
              setQuestion("all");
              setQuery(e.target.value);
            }}
          />
          <span>/</span>
        </label>
        <div className="nav-label">Platform</div>
        <nav>
          <button
            className={view === "browse" && selected === "all" ? "active" : ""}
            onClick={() => nav("browse")}
          >
            <LayoutGrid />
            Browse solvers
            <span className="nav-count">{data.solvers.length}</span>
          </button>
          <button
            className={view === "leaderboard" ? "active" : ""}
            onClick={() => nav("leaderboard")}
          >
            <Trophy />
            Leaderboard
          </button>
          <button
            className={view === "mine" ? "active" : ""}
            onClick={() => (user ? nav("mine") : gated({ kind: "upload" }))}
          >
            <Layers />
            My contributions
          </button>
          <button
            className={view === "issues" ? "active" : ""}
            onClick={() => (user ? nav("issues") : gated({ kind: "login" }))}
          >
            <Inbox />
            Issue inbox
          </button>
        </nav>
        <div className="nav-label assignment-label">
          COURSEWORK <span>{data.assignments.length}</span>
        </div>
        <nav className="assignment-nav">
          {data.assignments.map((a) => (
            <button
              key={a.id}
              className={selected === a.id && view === "browse" ? "active" : ""}
              onClick={() => nav("browse", a.id)}
            >
              <BookOpen />
              {a.title.replace("Graded ", "")}
            </button>
          ))}
        </nav>
        {admin && (
          <button
            className="admin-button"
            onClick={() => open({ kind: "assignment" })}
          >
            <Settings size={17} /> Create coursework
          </button>
        )}
        <div className="sidebar-bottom">
          {user ? (
            <button
              className="profile"
              onClick={async () => {
                await logout();
                setUser(null);
                nav("browse");
              }}
            >
              <span className="avatar">
                {initials(user.displayName || "Student")}
              </span>
              <span>
                {user.displayName}
                <small>{admin ? "Administrator" : "Student contributor"}</small>
              </span>
              <LogOut size={17} />
            </button>
          ) : (
            <button
              className="sidebar-signin"
              onClick={() => open({ kind: "login" })}
            >
              Sign in to contribute <Plus size={17} />
            </button>
          )}
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {view === "leaderboard"
                ? "Leaderboard"
                : view === "mine"
                  ? "My contributions"
                  : view === "issues"
                    ? "Issue inbox"
                    : "Browse solvers"}
            </strong>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle icon-button"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
                className="theme-toggle icon-button"
                onClick={() => window.open("https://dueline-tds.vercel.app/", "_blank", "noopener,noreferrer")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-check-fill" viewBox="0 0 16 16">
  <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2m-5.146-5.146-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
</svg> Check out deadlines
              </button>
            {user ? (
              <span className="avatar small">
                {initials(user.displayName || "Student")}
              </span>
            ) : (
              <button
                className="signin"
                onClick={() => open({ kind: "login" })}
              >
                <span className="google-g">G</span>Continue with Google
              </button>
            )}
          </div>
        </header>
        <main>
          {error && !modal && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {view === "leaderboard" ? (
            <>
              <div className="page-heading">
                <div className="eyebrow">A LITTLE RECOGNITION</div>
                <h1>The people behind the help.</h1>
                <p>
                  Every shared solver makes the next student’s journey a little
                  easier.
                </p>
              </div>
              <section className="leaderboard">
                <div className="section-heading">
                  <h2>Community leaderboard</h2>
                  <span>Ranked by solvers shared</span>
                </div>
                {ranks.length ? (
                  ranks.map((r, i) => (
                    <div className="rank-row" key={r.id}>
                      <span className={`rank ${i === 0 ? "gold" : ""}`}>
                        {i === 0 ? (
                          <Trophy size={21} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      <span className="avatar">{initials(r.name)}</span>
                      <strong>
                        {r.name}
                        {r.id === user?.uid && <small>That’s you!</small>}
                      </strong>
                      <span>
                        <b>{r.count}</b> {r.count === 1 ? "solver" : "solvers"}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="The first spot could be yours."
                    text="Share a solver to start the leaderboard."
                  />
                )}
                <p className="table-note">
                  One solver per contributor per question. Updating a solver
                  keeps your count the same.
                </p>
              </section>
            </>
          ) : view === "issues" ? (
            <>
              <div className="page-heading">
                <div className="eyebrow">KEEP GETTING BETTER</div>
                <h1>Your issue inbox.</h1>
                <p>
                  Follow reports you’ve submitted and help students using your
                  solvers.
                </p>
              </div>
              {issues.length ? (
                issues
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((i) => (
                    <article className="issue-card" key={i.id}>
                      <span
                        className={`badge ${i.status === "resolved" ? "green" : ""}`}
                      >
                        {i.status}
                      </span>
                      <h3>{i.subject}</h3>
                      <p className="muted">
                        {i.solverTitle} · Reported by {i.reporterName} ·{" "}
                        {date(i.createdAt)}
                      </p>
                      <p className="preserve">{i.message}</p>
                      {i.status === "resolved" && (
                        <div className="resolution-note">
                          <strong>
                            <Check size={16} /> Resolved by the solver creator
                          </strong>
                          {i.resolvedAt && (
                            <span className="muted">{date(i.resolvedAt)}</span>
                          )}
                          <p className="preserve">
                            {i.resolution ||
                              "The creator has confirmed this issue is resolved."}
                          </p>
                        </div>
                      )}
                      <div className="issue-footer">
                        {i.creatorId === user?.uid && i.status === "open" && (
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() => open({ kind: "resolve", issue: i })}
                          >
                            <Check size={16} /> Mark resolved
                          </button>
                        )}
                      </div>
                    </article>
                  ))
              ) : (
                <Empty
                  title="All quiet here."
                  text="Issues you report and reports on your solvers will appear here."
                />
              )}
            </>
          ) : (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">THE COMMUNITY WORKSPACE</div>
                  <h1>
                    {view === "mine"
                      ? "My contributions"
                      : assignment
                        ? assignment.title
                        : "Your next solution starts here."}
                  </h1>
                  <p>
                    {view === "mine"
                      ? "Manage the solvers you’ve shared with the community."
                      : assignment
                        ? `${assignment.questionCount} questions. Find a starting point, share what worked, and learn together.`
                        : "A shared library of tools and ideas. Built by your TDS community."}
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => gated({ kind: "upload" })}
                >
                  <Plus size={18} /> Share a solver
                </button>
              </section>
              <section className="stats">
                <Stat
                  icon={<Code2 />}
                  value={data.solvers.length}
                  label="Community solvers"
                />
                <Stat
                  icon={<BookOpen />}
                  value={data.assignments.length}
                  label="Assignments & projects"
                />
                <Stat
                  icon={<Users />}
                  value={ranks.length}
                  label="Student contributors"
                />
                <div className="stat last-stat">
                  <div className="stat-icon">
                    <Layers />
                  </div>
                  <div>
                    <strong>{totalQuestions}</strong>
                    <span>Questions to explore</span>
                  </div>
                </div>
              </section>
              {view === "browse" && selected === "all" && (
                <CommunityOverview
                  assignments={data.assignments}
                  solvers={data.solvers}
                  ranks={ranks}
                  onAssignment={(id) => nav("browse", id)}
                  onLeaderboard={() => nav("leaderboard")}
                />
              )}
              <section className="browse">
                <div className="section-heading">
                  <div>
                    <h2>
                      {view === "mine"
                        ? "My contributions"
                        : assignment
                          ? "Explore this coursework"
                          : "Solver library"}
                    </h2>
                    <p>
                      {assignment?.deadline
                        ? `Deadline: ${date(assignment.deadline)}`
                        : "Explore a question. Find a tool. Understand how it works."}
                    </p>
                  </div>
                  <div className="tabs" aria-label="Coursework type">
                    {["all", "assignment", "project"].map((t) => (
                      <button
                        key={t}
                        className={type === t ? "selected" : ""}
                        onClick={() => setType(t)}
                      >
                        {t === "all"
                          ? "All coursework"
                          : t === "assignment"
                            ? "Assignments"
                            : "Projects"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-bar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      aria-label="Search solvers"
                      placeholder="Search solvers, questions, or creators…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <select
                    aria-label="Filter assignment"
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value);
                      setQuestion("all");
                    }}
                  >
                    <option value="all">All assignments</option>
                    {data.assignments.map((a) => (
                      <option value={a.id} key={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  {assignment && (
                    <select
                      aria-label="Filter question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                    >
                      <option value="all">All questions</option>
                      {Array.from(
                        { length: assignment.questionCount },
                        (_, i) => (
                          <option key={i} value={i + 1}>
                            Question {i + 1}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                  <select
                    aria-label="Sort solvers"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                </div>
                <div className="results-caption">
                  <span>
                    {solvers.length}{" "}
                    {solvers.length === 1 ? "solver" : "solvers"}
                    {query ? ` matching “${query}”` : " to get you started"}
                  </span>
                  <span>Learn it. Build it. Pass it on.</span>
                </div>
                {loading ? (
                  <Empty
                    title="Loading TDS SolverStore…"
                    text="Finding your community’s contributions."
                  />
                ) : solvers.length ? (
                  <div className="solver-grid">
                    {solvers.map((s, i) => (
                      <article className="solver-card" key={s.id}>
                        <div className="card-top">
                          <span className={`solver-icon color-${i % 3}`}>
                            <Code2 size={22} />
                          </span>
                          <span className="badge">
                            {data.assignments.find(
                              (a) => a.id === s.assignmentId,
                            )?.type === "project"
                              ? "PROJECT"
                              : "ASSIGNMENT"}{" "}
                            <span>·</span> Q{s.question}
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Report issue with ${s.title}`}
                            title="Report an issue"
                            onClick={() => gated({ kind: "report", solver: s })}
                          >
                            <Flag size={16} />
                          </button>
                        </div>
                        <div className="course-name">
                          {
                            data.assignments.find(
                              (a) => a.id === s.assignmentId,
                            )?.title
                          }
                        </div>
                        <button
                          className="card-title"
                          onClick={() => open({ kind: "detail", solver: s })}
                        >
                          {s.title}
                        </button>
                        <p className="card-description">
                          {s.instructions
                            .replace(/[#*`\n]/g, " ")
                            .slice(0, 130)}
                        </p>
                        <div className="card-tags">
                          <span>
                            <LinkIcon size={13} />
                            {new URL(s.url).hostname.replace("www.", "")}
                          </span>
                          {s.resources.length > 0 && (
                            <span>
                              <BookOpen size={13} />
                              {s.resources.length} resource
                              {s.resources.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="card-bottom">
                          <span className={`avatar small tone-${i % 3}`}>
                            {initials(s.creatorName)}
                          </span>
                          <span className="creator">
                            {s.creatorName}
                            <small>{date(s.createdAt)}</small>
                          </span>
                          <button
                            className="view-button"
                            onClick={() => open({ kind: "detail", solver: s })}
                          >
                            View solver
                          </button>
                        </div>
                      </article>
                    ))}
                    <button
                      className="contribute-card"
                      onClick={() => gated({ kind: "upload" })}
                    >
                      <span className="contribute-plus">
                        <Plus size={25} />
                      </span>
                      <h3>Your solution could help someone.</h3>
                      <p>
                        Built something useful?
                        <br />
                        Give it a home here.
                      </p>
                      <span>Share a solver</span>
                    </button>
                  </div>
                ) : (
                  <Empty
                    title="A little room for your contribution."
                    text="No solvers match this view. Try another filter or share the first one."
                    action={() => gated({ kind: "upload" })}
                  />
                )}
              </section>
            </>
          )}
          <footer>
            <span>
              <Code2 size={16} /> TDS SolverStore
            </span>
            <p>
  Built by{" "}
  <a href="https://hi-sarang.vercel.app/" target="_blank" rel="noopener noreferrer">
    <strong>Sarang</strong>
  </a>
  . Powered by students. Free for everyone.
</p>
            <span>
              Made by{" "}
              <a
                href="https://hi-sarang.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sarang
              </a>
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          close={() => !busy && setModal(null)}
          title={
            modal.kind === "login"
              ? "A community starts with you."
              : modal.kind === "upload"
                ? "Share your solver"
                : modal.kind === "assignment"
                  ? "Create coursework"
                  : modal.kind === "report"
                    ? "Report an issue"
                    : modal.kind === "delete"
                      ? "Remove this solver?"
                      : modal.kind === "resolve"
                        ? "Resolve issue"
                        : modal.solver?.title
          }
        >
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {modal.kind === "login" ? (
            <div className="login-content">
              <div className="login-symbol">
                <Users size={30} />
              </div>
              <p>
                Browse freely. Sign in to share a solver, report an issue, and
                help your classmates. <strong> IIT Madras student accounts only</strong>
              </p>
              <button
                className="primary full"
                disabled={busy}
                onClick={() => signIn()}
              >
                <span aria-hidden="true">G</span>{" "}
                {busy ? "Connecting to Google…" : "Continue with Google"}
              </button>
            </div>
          ) : modal.kind === "upload" ? (
            <SolverForm
              assignments={data.assignments}
              selected={selected}
              solver={modal.solver}
              submit={(e) => submit(e, "solver")}
              busy={busy}
            />
          ) : modal.kind === "assignment" ? (
            <form onSubmit={(e) => submit(e, "assignment")}>
              <p className="muted">
                Create a place for students to share solvers for each question.
              </p>
              <Field label="Title">
                <input
                  name="title"
                  required
                  maxLength={100}
                  placeholder="e.g. Graded Assignment 7"
                />
              </Field>
              <div className="form-row">
                <Field label="Coursework type">
                  <select name="type">
                    <option value="assignment">Assignment</option>
                    <option value="project">Take-home project</option>
                  </select>
                </Field>
                <Field label="Number of questions">
                  <input
                    type="number"
                    name="questionCount"
                    required
                    min="1"
                    max="100"
                    defaultValue="4"
                  />
                </Field>
              </div>
              <Field label="Deadline (optional)">
                <input type="datetime-local" name="deadline" />
              </Field>
              <p className="field-help">
                Deadline uses your device’s local time. Solvers remain available
                after the deadline.
              </p>
              <Submit busy={busy}>Create coursework</Submit>
            </form>
          ) : modal.kind === "report" ? (
            <form
              onSubmit={(e) =>
                submit(e, "report", { solverId: modal.solver.id })
              }
            >
              <p className="muted">
                For <strong>{modal.solver.title}</strong>. The creator will see
                your report in their issue inbox.
              </p>
              <Field label="What’s the issue?">
                <input
                  name="subject"
                  required
                  maxLength={150}
                  placeholder="e.g. Link no longer works"
                />
              </Field>
              <Field label="Help the creator reproduce it">
                <textarea
                  name="message"
                  required
                  rows="5"
                  maxLength={3000}
                  placeholder="What did you try? What happened instead? Please omit passwords and personal data."
                />
              </Field>
              <Submit busy={busy}>Submit issue</Submit>
            </form>
          ) : modal.kind === "resolve" ? (
            <form
              onSubmit={(e) => submit(e, "resolve", { id: modal.issue.id })}
            >
              <p className="muted">
                Confirm that you have fixed{" "}
                <strong>{modal.issue.subject}</strong>. Your resolution will be
                visible to the student who reported it.
              </p>
              <Field label="What was fixed?">
                <textarea
                  name="resolution"
                  required
                  maxLength={3000}
                  rows={5}
                  placeholder="Describe the fix and any steps the student should try."
                />
              </Field>
              <Submit busy={busy}>Confirm resolved</Submit>
            </form>
          ) : modal.kind === "delete" ? (
            <>
              <p>
                This removes your solver from the library and contributor count.
              </p>
              <button
                className="danger full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await action("deleteSolver", { id: modal.solver.id });
                    setModal(null);
                    setToast("Solver removed.");
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove solver
              </button>
            </>
          ) : (
            <div className="solver-detail">
              <div className="detail-meta">
                <span className="badge">Question {modal.solver.question}</span>
                <span>
                  {
                    data.assignments.find(
                      (a) => a.id === modal.solver.assignmentId,
                    )?.title
                  }
                </span>
              </div>
              <p className="muted">
                Shared by {modal.solver.creatorName} ·{" "}
                {date(modal.solver.createdAt)}
              </p>
              <a
                className="primary full"
                href={modal.solver.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open solver <ExternalLink size={17} />
              </a>
              <h3>How to use it</h3>
              <div className="markdown">
                <ReactMarkdown>{modal.solver.instructions}</ReactMarkdown>
              </div>
              {modal.solver.resources.length > 0 && (
                <>
                  <h3>Learn from the resources</h3>
                  <div className="resources">
                    {modal.solver.resources.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen size={17} />
                        <span>{url}</span>
                        <ExternalLink size={15} />
                      </a>
                    ))}
                  </div>
                </>
              )}
              <div className="detail-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    gated({ kind: "report", solver: modal.solver })
                  }
                >
                  <Flag size={15} /> Report an issue
                </button>
                {modal.solver.creatorId === user?.uid && (
                  <button
                    className="secondary"
                    onClick={() =>
                      open({ kind: "upload", solver: modal.solver })
                    }
                  >
                    Edit solver
                  </button>
                )}
                {(modal.solver.creatorId === user?.uid || admin) && (
                  <button
                    className="text-danger"
                    onClick={() =>
                      open({ kind: "delete", solver: modal.solver })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Submit({ busy, children }) {
  return (
    <button className="primary full" disabled={busy} type="submit">
      {busy ? "Saving…" : children}
    </button>
  );
}
function SolverForm({ assignments, selected, solver, submit, busy }) {
  const [aid, setAid] = useState(
      solver?.assignmentId ||
        (selected !== "all" ? selected : assignments[0]?.id || ""),
    ),
    [preview, setPreview] = useState(false),
    [markdown, setMarkdown] = useState(solver?.instructions || "");
  const a = assignments.find((a) => a.id === aid);
  if (!assignments.length)
    return (
      <Empty
        title="No coursework yet."
        text="The administrator needs to create an assignment or project first."
      />
    );
  return (
    <form onSubmit={submit}>
      <p className="muted">
        Share a useful link and the steps someone needs to get started.
      </p>
      <div className="form-row">
        <Field label="Assignment or project">
          <select
            name="assignmentId"
            value={aid}
            onChange={(e) => setAid(e.target.value)}
            disabled={!!solver}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          {solver && <input type="hidden" name="assignmentId" value={aid} />}
        </Field>
        <Field label="Question">
          <select
            key={aid}
            name="question"
            defaultValue={solver?.question || 1}
            disabled={!!solver}
          >
            {Array.from({ length: a?.questionCount || 0 }, (_, i) => (
              <option value={i + 1} key={i}>
                Question {i + 1}
              </option>
            ))}
          </select>
          {solver && (
            <input type="hidden" name="question" value={solver.question} />
          )}
        </Field>
      </div>
      <Field label="Solver title">
        <input
          name="title"
          defaultValue={solver?.title}
          required
          maxLength={120}
          placeholder="Give your solver a clear, useful name"
        />
      </Field>
      <Field label="Solver URL">
        <input
          name="url"
          type="url"
          required
          defaultValue={solver?.url}
          placeholder="https://your-tool.com or a GitHub repository"
        />
      </Field>
      <div className="editor-heading">
        <strong>How to use it</strong>
        <button type="button" onClick={() => setPreview(!preview)}>
          {preview ? "Write Markdown" : "Preview Markdown"}
        </button>
      </div>
      <textarea
        className={preview ? "hidden" : ""}
        name="instructions"
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        required={!preview}
        maxLength={10000}
        rows="7"
        placeholder={
          "## Getting started\n1. Open the link\n2. Add your input\n\nExplain any limitations here."
        }
      />
      {preview && (
        <div className="markdown markdown-preview">
          <ReactMarkdown>
            {markdown || "*Nothing to preview yet.*"}
          </ReactMarkdown>
        </div>
      )}
      <p className="field-help">
        Markdown supported: headings, lists, links, and code blocks.
      </p>
      <Field label="Learning resources (optional)">
        <textarea
          name="resources"
          defaultValue={solver?.resources.join("\n")}
          rows="3"
          placeholder="One http or https URL per line, up to 10."
        />
      </Field>
      <p className="field-help">
        One solver per question per student. Sharing again updates your existing
        contribution.
      </p>
      <Submit busy={busy}>{solver ? "Save changes" : "Publish solver"}</Submit>
    </form>
  );
}
function Stat({ icon, value, label }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <Layers size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="secondary" onClick={action}>
          <Plus size={16} /> Share a solver
        </button>
      )}
    </div>
  );
}
function Modal({ title, close, children }) {
  const ref = useRef();
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const handler = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            'button,a,input,select,textarea,[tabindex="0"]',
          ),
        ].filter((n) => !n.disabled && n.offsetParent !== null);
        const first = nodes[0],
          last = nodes.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
initializeFirebase().then(() =>
  createRoot(document.getElementById("root")).render(<App />),
);
