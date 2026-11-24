import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedEmail,
  requireStudent,
  assignmentInput,
  solverInput,
  safeUrl,
} from "../shared/validation.js";
test("only exact IITM student domains are accepted", () => {
  for (const email of ["a@study.iitm.ac.in", "a@ds.study.iitm.ac.in"])
    assert.ok(allowedEmail(email));
  for (const email of [
    "a@gmail.com",
    "a@study.iitm.ac.in.evil.com",
    "a@evil.study.iitm.ac.in",
    "@study.iitm.ac.in",
    null,
  ])
    assert.ok(!allowedEmail(email));
});
test("authentication requires verified Google identity", () => {
  const token = {
    email: "a@study.iitm.ac.in",
    email_verified: true,
    firebase: { sign_in_provider: "google.com" },
  };
  assert.doesNotThrow(() => requireStudent(token));
  assert.throws(() => requireStudent({ ...token, email_verified: false }));
  assert.throws(() =>
    requireStudent({ ...token, firebase: { sign_in_provider: "password" } }),
  );
});
test("solver URLs cannot execute scripts or contain credentials", () => {
  assert.equal(safeUrl("https://github.com/a/b"), "https://github.com/a/b");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://user:pass@example.com",
    "not a url",
  ])
    assert.throws(() => safeUrl(url));
});
test("assignment question count and optional deadline are validated", () => {
  assert.equal(
    assignmentInput({
      title: "Assignment 5",
      questionCount: 4,
      type: "assignment",
    }).deadline,
    null,
  );
  for (const n of [0, -1, 101, 1.5, "oops"])
    assert.throws(() =>
      assignmentInput({ title: "A", questionCount: n, type: "assignment" }),
    );
  assert.throws(() =>
    assignmentInput({
      title: "A",
      questionCount: 4,
      type: "assignment",
      deadline: "nonsense",
    }),
  );
});
test("solvers must reference an existing question and validate resource links", () => {
  const input = {
    title: "My solver",
    url: "https://example.com",
    instructions: "## How to use",
    question: 4,
    assignmentId: "a",
    resources: "https://example.com/docs",
  };
  assert.equal(solverInput(input, { questionCount: 4 }).resources.length, 1);
  assert.throws(() =>
    solverInput({ ...input, question: 5 }, { questionCount: 4 }),
  );
  assert.throws(() =>
    solverInput(
      { ...input, resources: "javascript:alert(1)" },
      { questionCount: 4 },
    ),
  );
  assert.throws(() =>
    solverInput({ ...input, instructions: "" }, { questionCount: 4 }),
  );
});
