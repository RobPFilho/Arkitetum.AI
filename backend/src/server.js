import dotenv from "dotenv";
dotenv.config({ path: "KEYS.env" });
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import matchRoutes from "./routes/matches.js";
import materialRoutes from "./routes/materials.js";
import architectRoutes from "./routes/architects.js";

const app = express(),
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 40 }),
  authRoutes,
);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/architects", architectRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use(express.static(path.join(root, "public")));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro inesperado no servidor" });
});
connectDatabase()
  .then(() =>
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Arkitetum running at http://localhost:${process.env.PORT || 3000}`),
    ),
  )
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
