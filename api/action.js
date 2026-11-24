import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "../server/firebase.js";
import { isAdministrator } from "../server/authorization.js";
import {
  requireStudent,
  cleanText,
  assignmentInput,
  solverInput,
  resolutionUpdate,
} from "../shared/validation.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  let db, token;
  try {
    db = getDatabase();
    token = await getAuth().verifyIdToken(
      (req.headers.authorization || "").replace(/^Bearer /, ""),
    );
    requireStudent(token);
  } catch {
    return res.status(401).json({
      error:
        "Sign in with an allowed student Google account. Check Firebase configuration if this persists.",
    });
  }
  const { action, data = {} } = req.body || {};
  const uid = token.uid;
  const admin = isAdministrator(token, req.adminEnvironment ?? process.env);
  const now = new Date().toISOString();
  try {
    if (action === "session") return res.json({ isAdmin: admin });
    if (action === "assignment") {
      if (!admin)
        return res
          .status(403)
          .json({ error: "Only the administrator can create assignments." });
      const item = { ...assignmentInput(data), createdAt: now };
      const ref = await db.collection("assignments").add(item);
      return res.json({ item: { ...item, id: ref.id } });
    }
    if (action === "solver") {
      const assignment = await db
        .collection("assignments")
        .doc(cleanText(data.assignmentId, "Assignment"))
        .get();
      if (!assignment.exists) throw new Error("Assignment not found.");
      const item = {
        ...solverInput(data, assignment.data()),
        creatorId: uid,
        creatorName: (token.name || "IITM Student").slice(0, 100),
        createdAt: now,
      };
      // Every submission is independent, including repeat contributions to a question.
      const ref = await db.collection("solvers").add(item);
      return res.json({ item: { ...item, id: ref.id } });
    }
    if (action === "deleteSolver") {
      const ref = db.collection("solvers").doc(cleanText(data.id, "Solver"));
      const item = await ref.get();
      if (!item.exists) throw new Error("Solver not found.");
      if (item.data().creatorId !== uid && !admin)
        return res
          .status(403)
          .json({ error: "You cannot remove this solver." });
      await ref.delete();
      return res.json({ ok: true });
    }
    if (action === "issues") {
      const owned = await db
        .collection("issues")
        .where("creatorId", "==", uid)
        .get();
      const reported = await db
        .collection("issues")
        .where("reporterId", "==", uid)
        .get();
      return res.json({
        items: [
          ...new Map(
            [...owned.docs, ...reported.docs].map((d) => [
              d.id,
              { id: d.id, ...d.data() },
            ]),
          ).values(),
        ],
      });
    }
    if (action === "resolve") {
      const ref = db.collection("issues").doc(cleanText(data.id, "Issue"));
      const item = await ref.get();
      if (!item.exists || item.data().creatorId !== uid)
        return res
          .status(403)
          .json({ error: "Only the solver creator can resolve this issue." });
      await ref.update(resolutionUpdate(data, item.data(), uid, now));
      return res.json({ ok: true });
    }
    if (action === "report") {
      const solver = await db
        .collection("solvers")
        .doc(cleanText(data.solverId, "Solver"))
        .get();
      if (!solver.exists) throw new Error("Solver no longer exists.");
      const subject = cleanText(data.subject, "Subject", 150),
        message = cleanText(data.message, "Description", 3000);
      const issue = {
        solverId: solver.id,
        solverTitle: solver.data().title,
        creatorId: solver.data().creatorId,
        reporterId: uid,
        reporterName: token.name || "Student",
        subject,
        message,
        status: "open",
        createdAt: now,
      };
      const ref = db.collection("issues").doc();
      const rate = db.collection("reportLimits").doc(uid);
      await db.runTransaction(async (tx) => {
        const last = await tx.get(rate);
        if (last.exists && Date.now() - last.data().at < 60000)
          throw new Error(
            "Please wait a minute before submitting another issue.",
          );
        tx.set(rate, { at: Date.now() });
        tx.set(ref, issue);
      });
      return res.json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    const expected =
      /required|maximum|valid|Choose|Invalid|not found|resource|wait a minute|no longer/.test(
        error.message,
      );
    return res.status(expected ? 400 : 500).json({
      error: expected
        ? error.message
        : "Unable to save. Check server configuration and try again.",
    });
  }
}
