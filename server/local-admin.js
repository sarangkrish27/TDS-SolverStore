import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

// Read on each local request: process.env can retain values from before a Vite restart.
export function localAdminEnvironment(directory, mode) {
  const env = {};
  for (const name of [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`]) {
    try {
      Object.assign(env, parseEnv(readFileSync(join(directory, name), "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return { ADMIN_EMAIL: env.ADMIN_EMAIL };
}
