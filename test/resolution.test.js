import test from "node:test";
import assert from "node:assert/strict";
import { resolutionUpdate } from "../shared/validation.js";
test("only the creator can resolve, including when the caller is a reporter or admin", () => {
  for (const uid of ["reporter", "admin"])
    assert.throws(
      () =>
        resolutionUpdate(
          { resolution: "Fixed" },
          { creatorId: "creator" },
          uid,
          "now",
        ),
      { status: 403 },
    );
  assert.throws(
    () =>
      resolutionUpdate({ resolution: "Fixed" }, undefined, "creator", "now"),
    { status: 403 },
  );
});
test("resolution stores the creator, timestamp and trimmed fix description", () => {
  assert.deepEqual(
    resolutionUpdate(
      { resolution: "  Updated the link.  " },
      { creatorId: "creator" },
      "creator",
      "2026-11-23T12:00:00Z",
    ),
    {
      status: "resolved",
      resolution: "Updated the link.",
      resolvedBy: "creator",
      resolvedAt: "2026-11-23T12:00:00Z",
    },
  );
});
test("empty and excessive resolution notes are rejected", () => {
  for (const resolution of ["", "   ", "x".repeat(3001)])
    assert.throws(() =>
      resolutionUpdate(
        { resolution },
        { creatorId: "creator" },
        "creator",
        "now",
      ),
    );
});
