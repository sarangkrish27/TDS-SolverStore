import { loadEnv } from "vite";
import { publicFirebaseConfig } from "../server/public-config.js";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "ADMIN_EMAIL",
];
const missing = required.filter((key) => !env[key]?.trim());
const errors = missing.map((key) => `${key} is missing`);
for (const [key, value] of Object.entries(publicFirebaseConfig(env))) {
  if (!value.trim())
    errors.push(`Firebase web setting ${key} is missing (see .env.example)`);
}
if (
  env.FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.FIREBASE_PROJECT_ID !== env.VITE_FIREBASE_PROJECT_ID
)
  errors.push("Firebase client and server project IDs must match");
if (
  env.FIREBASE_PRIVATE_KEY &&
  !env.FIREBASE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")
)
  errors.push("FIREBASE_PRIVATE_KEY must contain the complete PEM private key");
if (errors.length) {
  console.error(
    "Configuration is not ready:\n" +
      errors.map((message) => " - " + message).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Required environment values are present. Credentials are not printed. Google sign-in and Firestore access still require a live verification.",
  );
