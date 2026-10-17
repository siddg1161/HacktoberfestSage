import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env.js";
import quoteRoutes from "./routes/quote.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";

const app = express();

// 1. Global Middleware
app.use(
  cors({
    origin: "*", // Allow React dev server (e.g. http://localhost:5173 or :3000)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// High limit to comfortably handle Base64 handwritten slip images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 2. Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "QuoteFlow AI Express Backend",
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes
app.use("/api/quotes", quoteRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/inventory", inventoryRoutes);

// 4. Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found.`,
  });
});

// 5. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Unhandled Server Error]:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error.",
  });
});

// 6. Start Server
app.listen(config.port, "0.0.0.0", () => {
  console.log("=================================================");
  console.log(` 🚀 QuoteFlow AI Express Backend Live on Port ${config.port}`);
  console.log(` 📡 Health Check: http://localhost:${config.port}/health`);
  console.log(` 📋 Quotes API:   http://localhost:${config.port}/api/quotes`);
  console.log(` 📦 Inventory API: http://localhost:${config.port}/api/inventory/catalog`);
  console.log(` 🌐 Client Portal: http://localhost:${config.port}/api/portal/:threadId`);
  console.log("=================================================");
});

export default app;
