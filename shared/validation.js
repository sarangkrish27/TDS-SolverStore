export function resolutionUpdate(data, issue, uid, now) {
  if (!issue || issue.creatorId !== uid) {
    const error = new Error("Only the solver creator can resolve this issue.");
    error.status = 403;
    throw error;
  }
  return {
    status: "resolved",
    resolution: cleanText(data.resolution, "Resolution", 3000),
    resolvedAt: now,
    resolvedBy: uid,
  };
}
export const allowedEmail = (email) =>
  /^[^@\s]+@(ds\.study\.iitm\.ac\.in|study\.iitm\.ac\.in)$/.test(email || "");
export function requireStudent(token) {
  if (
    !allowedEmail(token.email) ||
    !token.email_verified ||
    token.firebase?.sign_in_provider !== "google.com"
  )
    throw new Error("Use a verified IITM student Google account.");
}
export function cleanText(value, label, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
export function safeUrl(value) {
  const input = cleanText(value, "URL", 2000);
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid http or https URL.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Enter a valid http or https URL.");
  return url.href;
}
export function assignmentInput(data) {
  const title = cleanText(data.title, "Title", 100);
  const count = Number(data.questionCount);
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error("Choose between 1 and 100 questions.");
  if (!["assignment", "project"].includes(data.type))
    throw new Error("Invalid assignment type.");
  let deadline = null;
  if (data.deadline) {
    if (!Number.isFinite(Date.parse(data.deadline)))
      throw new Error("Invalid deadline.");
    deadline = new Date(data.deadline).toISOString();
  }
  return { title, questionCount: count, type: data.type, deadline };
}
export function solverInput(data, assignment) {
  const question = Number(data.question);
  if (
    !Number.isInteger(question) ||
    question < 1 ||
    question > assignment.questionCount
  )
    throw new Error("Select a valid question.");
  const resources = String(data.resources || "")
    .trim()
    .split("\n")
    .filter(Boolean);
  if (resources.length > 10) throw new Error("Use up to 10 resource URLs.");
  return {
    title: cleanText(data.title, "Title", 120),
    url: safeUrl(data.url),
    instructions: cleanText(data.instructions, "Instructions", 10000),
    resources: resources.map(safeUrl),
    question,
    assignmentId: data.assignmentId,
  };
}
