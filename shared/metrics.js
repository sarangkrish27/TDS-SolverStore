export function contributionDays(solvers, now = new Date(), length = 14) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  return Array.from({ length }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - length + 1 + index);
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      count: solvers.filter(
        (s) =>
          typeof s.createdAt === "string" && s.createdAt.slice(0, 10) === key,
      ).length,
    };
  });
}
export function courseworkCoverage(assignment, solvers) {
  const covered = new Set(
    solvers
      .filter(
        (s) =>
          s.assignmentId === assignment.id &&
          Number.isInteger(s.question) &&
          s.question > 0 &&
          s.question <= assignment.questionCount,
      )
      .map((s) => s.question),
  ).size;
  return {
    covered,
    percent: assignment.questionCount
      ? Math.round((covered / assignment.questionCount) * 100)
      : 0,
  };
}
