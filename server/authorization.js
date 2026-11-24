import { requireStudent } from "../shared/validation.js";

export function isAdministrator(token, env = process.env) {
  try {
    requireStudent(token);
  } catch {
    return false;
  }
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(email && token.email?.toLowerCase() === email);
}
