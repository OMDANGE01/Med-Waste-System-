import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

import dbConfig from "./backend/src/config/db.js";
import wasteRoutes from "./backend/src/routes/wasteRoutes.js";
import pickupRoutes from "./backend/src/routes/pickupRoutes.js";
import incidentRoutes from "./backend/src/routes/incidentRoutes.js";
import authRoutes from "./backend/src/routes/authRoutes.js";
import hardwareRoutes from "./backend/src/routes/hardwareRoutes.js";
import hospitalRoutes from "./backend/src/routes/hospitalRoutes.js";
import syncRoutes from "./backend/src/routes/syncRoutes.js";
import auditRoutes from "./backend/src/routes/auditRoutes.js";
import downloadRoutes from "./backend/src/routes/downloadRoutes.js";
import wasteCtrl from "./backend/src/controllers/wasteController.js";

const { connectDB, isConnected, getConnectionDetails } = dbConfig;

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
    const details: any = typeof getConnectionDetails === "function" ? getConnectionDetails() : {};
    res.json({
      status: "online",
      service: "MED_WASTE - Medical Waste Management System",
      mongoConnected: isConnected(),
      storageEngine: isConnected() ? "MongoDB Atlas (Mongoose)" : "Local Resilient Storage Engine",
      databaseDetails: details,
      timestamp: new Date().toISOString(),
    });
  });

  // DB Reconnect / Diagnostic API
  app.post("/api/db/reconnect", async (req, res) => {
    try {
      const connected = await connectDB();
      const details: any = typeof getConnectionDetails === "function" ? getConnectionDetails() : {};
      res.json({
        success: connected,
        mongoConnected: connected,
        message: connected
          ? "Connected to MongoDB Atlas successfully"
          : `Notice: External MongoDB not reachable (${details.lastError || "Check network/credentials"}). Active storage engine: Local Resilient Store.`,
        databaseDetails: details,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        mongoConnected: false,
        message: err.message,
      });
    }
  });

  // API routes FIRST
  app.use("/api/auth", authRoutes);
  app.use("/api/hospitals", hospitalRoutes);
  app.use("/api/sync", syncRoutes);
  app.use("/api/hardware", hardwareRoutes);
  app.use("/api/waste", wasteRoutes);
  app.use("/api/pickups", pickupRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/download", downloadRoutes);

  // Direct APK file download routes
  app.get(["/download/apk", "/download/medwaste-guard.apk", "/downloads/medwaste-guard-khamgaon-v1.0.0.apk", "/medwaste-guard.apk"], (req, res) => {
    const apkPath = path.join(process.cwd(), "public/downloads/medwaste-guard-khamgaon-v1.0.0.apk");
    if (fs.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", 'attachment; filename="medwaste-guard-khamgaon-v1.0.0.apk"');
      res.sendFile(apkPath);
    } else {
      res.redirect("/api/download/apk");
    }
  });

  // Global /api/stats endpoint
  app.get("/api/stats", wasteCtrl.getWasteStats);

  // 404 guard for unmatched API routes (prevents Vite SPA fallback from returning HTML)
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `API route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Dedicated Service Worker and PWA Manifest delivery
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(path.join(process.cwd(), "public/sw.js"));
  });

  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.join(process.cwd(), "public/manifest.json"));
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
