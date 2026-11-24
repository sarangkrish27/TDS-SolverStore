import { getApps, initializeApp, cert } from "firebase-admin/app";
import { Firestore } from "@google-cloud/firestore";
import { GoogleAuth, JWT } from "google-auth-library";

export function firestoreOptions(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  const client = new JWT({
    email: env.FIREBASE_CLIENT_EMAIL,
    key: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return { projectId, auth: new GoogleAuth({ projectId, authClient: client }) };
}

let database;
export function getDatabase() {
  if (database) return database;
  const options = firestoreOptions(process.env);
  if (!getApps().length)
    initializeApp({
      projectId: options.projectId,
      credential: cert({
        projectId: options.projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  // Explicit auth avoids the deprecated credentials constructor in the SDK wrapper.
  database = new Firestore(options);
  return database;
}
