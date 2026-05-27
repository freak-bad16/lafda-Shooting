/**
 * EXPRESS APP
 * Configure middleware and routes. No socket logic here.
 */

import express from "express";
import cors from "cors";
import healthRoute from "./routes/healthRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/", healthRoute);

export default app;