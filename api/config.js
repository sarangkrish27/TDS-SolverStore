import { publicFirebaseConfig } from "../server/public-config.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const config = publicFirebaseConfig(process.env);
  if (Object.values(config).some((value) => !value.trim())) {
    return res
      .status(503)
      .json({
        error:
          "Firebase is not configured yet. Please try again once setup is complete.",
      });
  }
  return res.json(config);
}
