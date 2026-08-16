import express = require("express");
import { healthCheck } from "../controllers/health.controller";
import authRoutes = require("./auth.routes");
import projectRoutes = require("./project.routes");
import taskRoutes = require("./task.routes");
import workspaceRoutes = require("./workspace.routes");

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/", projectRoutes);
router.use("/", taskRoutes);

export = router;
