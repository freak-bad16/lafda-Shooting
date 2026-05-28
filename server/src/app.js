/**
 * EXPRESS APP
 * Configure middleware and routes. No socket logic here.
 */

import express from "express";
import cors from "cors";
import healthRoute from "./routes/healthRoute.js";

const app = express();

// Allow requests from the deployed Vercel frontend (set ALLOWED_ORIGIN in Railway env vars)
// Falls back to '*' during local dev if env var is not set.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// Routes
app.use("/", healthRoute);

export default app;