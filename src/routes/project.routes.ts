import express = require("express");
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../controllers/project.controller";
import authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/workspaces/:workspaceId/projects", authenticate, createProject);
router.get("/workspaces/:workspaceId/projects", authenticate, getProjects);
router.put("/projects/:projectId", authenticate, updateProject);
router.delete("/projects/:projectId", authenticate, deleteProject);

export = router;
