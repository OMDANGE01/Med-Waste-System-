import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

import dbConfig from "./backend/src/config/db.js";
import wasteRoutes from "./backend/src/routes/wasteRoutes.js";
import pickupRoutes from "./backend/src/routes/pickupRoutes.js";
import incidentRoutes from "./backend/src/routes/incidentRoutes.js";
import authRoutes from "./backend/src/routes/authRoutes.js";
import hardwareRoutes from "./backend/src/routes/hardwareRoutes.js";
import wasteCtrl from "./backend/src/controllers/wasteController.js";

const { connectDB, isConnected } = dbConfig;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.options("*", cors());
  app.use(express.json());

  // Connect Database (gracefully handles local fallback if Mongo not available)
  await connectDB();

  // Health Check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "MED_WASTE - Medical Waste Management System",
      mongoConnected: isConnected(),
      storageEngine: isConnected() ? "MongoDB (Mongoose)" : "Local Resilient Storage Engine",
      timestamp: new Date().toISOString(),
    });
  });

  // API routes FIRST
  app.use("/api/auth", authRoutes);
  app.use("/api/hardware", hardwareRoutes);
  app.use("/api/waste", wasteRoutes);
  app.use("/api/pickups", pickupRoutes);
  app.use("/api/incidents", incidentRoutes);

  // Global /api/stats endpoint
  app.get("/api/stats", wasteCtrl.getWasteStats);

  // 404 guard for unmatched API routes (prevents Vite SPA fallback from returning HTML)
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `API route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(` MedWaste Guard server running on port ${PORT}`);
    console.log(` Web App:     http://localhost:${PORT}`);
    console.log(` Health API:  http://localhost:${PORT}/api/health`);
    console.log(` Mode:        ${process.env.NODE_ENV || "development"}`);
    console.log(` Storage:     ${isConnected() ? "MongoDB Cloud/Cluster" : "Resilient High-Speed Store"}`);
    console.log(`====================================================`);
  });
}

startServer();
