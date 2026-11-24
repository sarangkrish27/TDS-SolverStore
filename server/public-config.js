// Only these four fields may ever be returned to a browser.
export function publicFirebaseConfig(env) {
  return {
    apiKey: env.FIREBASE_WEB_API_KEY || env.VITE_FIREBASE_API_KEY || "",
    authDomain:
      env.FIREBASE_WEB_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || "",
    appId: env.FIREBASE_WEB_APP_ID || env.VITE_FIREBASE_APP_ID || "",
  };
}
