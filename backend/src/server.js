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
import messageRoutes from "./routes/messages.js";
import reviewRoutes from "./routes/reviews.js";
import moodboardRoutes from "./routes/moodboard.js";
import projectRoutes from "./routes/projects.js";
import validationRoutes from "./routes/validations.js";
import statsRoutes from "./routes/stats.js";
import notificationRoutes from "./routes/notifications.js";

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
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/moodboard", moodboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/validations", validationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use(express.static(path.join(root, "public")));
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));
app.use((err, _req, res, _next) => {
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      error: Object.values(err.errors).map((e) => e.message).join("; "),
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado" });
  }
  console.error(err);
  res.status(500).json({ error: "Erro inesperado no servidor" });
});

// Rede de segurança: com todo handler assíncrono agora passando erros para o
// Express via asyncHandler, isto só pega o que escapar dessa cadeia — antes,
// uma promise rejeitada (ex.: erro de validação do Mongoose) derrubava o
// processo inteiro do Node em vez de responder 400/500 ao cliente.
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
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
