import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("API starts when require(ESM) is unavailable in the server runtime", () => {
  const result = spawnSync(process.execPath, [
    "--no-experimental-require-module",
    "--input-type=module",
    "-e",
    "await import('./api/action.js'); console.log('API loaded');",
  ], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /API loaded/);
});
