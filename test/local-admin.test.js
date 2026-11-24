import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localAdminEnvironment } from "../server/local-admin.js";
import { isAdministrator } from "../server/authorization.js";

test("local admin changes and removal apply without restarting the server", () => {
  const dir = mkdtempSync(join(tmpdir(), "tds-admin-"));
  const token = {email:"first@study.iitm.ac.in", email_verified:true, firebase:{sign_in_provider:"google.com"}};
  const admin = () => isAdministrator(token, localAdminEnvironment(dir, "development"));
  try {
    writeFileSync(join(dir, ".env"), `ADMIN_EMAIL=${token.email}`);
    assert.equal(admin(), true);
    writeFileSync(join(dir, ".env"), "ADMIN_EMAIL=second@study.iitm.ac.in");
    assert.equal(admin(), false);
    writeFileSync(join(dir, ".env.local"), `ADMIN_EMAIL=${token.email}`);
    assert.equal(admin(), true);
    writeFileSync(join(dir, ".env.development.local"), "ADMIN_EMAIL=");
    assert.equal(admin(), false);
    for (const file of [".env", ".env.local", ".env.development.local"]) rmSync(join(dir, file));
    assert.equal(admin(), false);
  } finally {
    for (const file of [".env", ".env.local", ".env.development.local"]) rmSync(join(dir, file), {force:true});
    rmdirSync(dir);
  }
});
