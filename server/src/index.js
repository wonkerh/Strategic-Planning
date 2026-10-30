import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { seed } from "./seed.js";
import { requireAuth } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import investmentRoutes from "./routes/investments.js";
import sectorRoutes from "./routes/sectors.js";
import userRoutes from "./routes/users.js";
import walletRoutes from "./routes/wallet.js";
import adminRoutes from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: false,
  })
);
app.use(express.json({ limit: "64kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sectors", sectorRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", requireAuth, userRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const publicDir = join(__dirname, "..", "..", "public");
app.use(express.static(publicDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(join(publicDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = Number(process.env.PORT || 3000);

await seed();
app.listen(port, () => {
  console.log("Strategic Planning running at http://localhost:" + port);
});