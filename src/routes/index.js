const express = require("express");

const router = express.Router();

const { healthCheck } = require("../controllers/health.controller");

const authRoutes = require("./auth.routes");
const workspaceRoutes = require("./workspace.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");


router.get("/health", healthCheck);


router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/", projectRoutes);
router.use("/", taskRoutes);

module.exports = router;  