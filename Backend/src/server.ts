import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env.js";
import quoteRoutes from "./routes/quote.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import businessRoutes from "./routes/business.routes.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

const app = express();

// 1. Global Middleware
app.use(
  cors({
    origin: config.trustedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Better Auth reads its own request stream, so it must run before JSON parsing.
app.all("/api/auth/*", toNodeHandler(auth));

// Keep requests bounded. Future uploads should use object storage rather than base64 JSON.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
app.use("/api/business", businessRoutes);

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
    error: "Internal server error.",
  });
});

// 6. Start Server
app.listen(config.port, "0.0.0.0", () => {
  console.log("=================================================");
  console.log(` 🚀 QuoteFlow AI Express Backend Live on Port ${config.port}`);
  console.log(` 📡 Health Check: http://localhost:${config.port}/health`);
  console.log(` 📋 Quotes API:   http://localhost:${config.port}/api/quotes`);
  console.log(` 📦 Inventory API: http://localhost:${config.port}/api/inventory/catalog`);
  console.log(` 🏢 Business API:  http://localhost:${config.port}/api/business`);
  console.log(` 🌐 Client Portal: http://localhost:${config.port}/api/portal/:threadId`);
  console.log("=================================================");
});

export default app;
