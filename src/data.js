import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { allowedEmail } from "../shared/validation.js";

let auth, db, setupError;
export async function initializeFirebase() {
  try {
    const response = await fetch("/api/config", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        "Firebase setup is incomplete. Please try again once configuration is ready.",
      );
    const config = await response.json();
    if (
      !["apiKey", "authDomain", "projectId", "appId"].every(
        (key) => typeof config[key] === "string" && config[key].trim(),
      )
    )
      throw new Error("Firebase configuration is incomplete.");
    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    setupError =
      error.message || "Unable to connect. Please refresh and try again.";
  }
}
function requireFirebase() {
  if (setupError) throw new Error(setupError);
}
export function subscribe(onData, onError) {
  if (setupError) {
    onData({ assignments: [], solvers: [] });
    onError(new Error(setupError));
    return () => {};
  }
  let current = { assignments: [], solvers: [] };
  const stops = ["assignments", "solvers"].map((key) =>
    onSnapshot(
      collection(db, key),
      (snap) => {
        current = {
          ...current,
          [key]: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
        };
        onData(current);
      },
      onError,
    ),
  );
  return () => stops.forEach((stop) => stop());
}
export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user && (!allowedEmail(user.email) || !user.emailVerified)) {
      callback(null);
      signOut(auth).catch(() => {});
    } else callback(user);
  });
}
export async function login() {
  requireFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const { user } = await signInWithPopup(auth, provider);
    if (!allowedEmail(user.email) || !user.emailVerified) {
      await signOut(auth);
      throw new Error(
        "Please use a verified @ds.study.iitm.ac.in or @study.iitm.ac.in Google account.",
      );
    }
    return user;
  } catch (error) {
    const messages = {
      "auth/popup-closed-by-user":
        "Google sign-in was cancelled. Please try again.",
      "auth/popup-blocked":
        "Allow pop-ups for this site, then continue with Google again.",
      "auth/unauthorized-domain":
        "Add this website hostname to Firebase Authentication’s authorized domains.",
      "auth/operation-not-allowed":
        "Enable the Google sign-in provider in Firebase Authentication.",
      "auth/network-request-failed":
        "Google sign-in could not connect. Check your internet connection and try again.",
      "auth/invalid-api-key":
        "The Firebase API key is invalid. Check .env and restart the app.",
    };
    throw new Error(
      messages[error.code] ||
        error.message ||
        "Google sign-in failed. Please try again.",
    );
  }
}
export async function logout() {
  if (auth) await signOut(auth);
}
export async function action(action, data = {}) {
  requireFirebase();
  if (!auth.currentUser)
    throw new Error("Please continue with Google before taking this action.");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, data }),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "The server did not return a valid response. Please try again.",
    );
  }
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}
