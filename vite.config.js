import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import configHandler from "./api/config.js";
import { localAdminEnvironment } from "./server/local-admin.js";
export default defineConfig(({ mode }) => ({
  // Prevent automatic exposure of arbitrary VITE_ environment values.
  envPrefix: "PUBLIC_UNUSED_",
  plugins: [
    react(),
    {
      name: "local-api",
      configureServer(server) {
        Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
        server.middlewares.use("/api/config", (req, res) => {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          configHandler(req, res);
        });
        server.middlewares.use("/api/action", async (req, res) => {
          const { default: handler } = await import("./api/action.js");
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          try {
            req.adminEnvironment = localAdminEnvironment(process.cwd(), mode);
            let body = "";
            for await (const chunk of req) {
              body += chunk;
              if (body.length > 40000) {
                res.status(413).json({ error: "Request too large" });
                return;
              }
            }
            req.body = body ? JSON.parse(body) : {};
            await handler(req, res);
          } catch {
            res.status(500).json({
              error: "Unable to process request. Check server configuration.",
            });
          }
        });
      },
    },
  ],
}));
