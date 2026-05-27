/**
 * ROUTE: healthRoute
 * Simple REST health check — confirms the API is alive.
 */

import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Lafda Shooting Server", timestamp: new Date().toISOString() });
});

export default router;
