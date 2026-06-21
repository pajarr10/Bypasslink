import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bypassRouter from "./bypass.js";
import adminRouter from "./admin.js";
import analyticsRouter from "./analytics.js";
import visitorRouter from "./visitor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve static files for local development
// On Vercel, files inside public/ are served automatically before reaching this function
app.use(express.static(join(__dirname, "../public")));

// API routes
app.use("/api/bypass", bypassRouter);
app.use("/api/admin", adminRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/visitor", visitorRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: true,
    name: "BipaSunlok",
    author: "Pajar",
    message: "API is running"
  });
});

// 404 handler for API-only unmatched routes
app.use("/api", (req, res) => {
  res.status(404).json({
    status: false,
    message: "Endpoint not found"
  });
});

// Fallback to index.html for non-API routes (SPA-like behavior)
app.use((req, res) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[API Error]", err);
  res.status(500).json({
    status: false,
    message: "Internal server error"
  });
});

// Local development server
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`BipaSunlok running at http://localhost:${PORT}`);
  });
}

export default app;
