const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const { 
    createProject,
    getProjects,
    updateProject,
    deleteProject
} = require("../controllers/project.controller");

router.post(
    "/workspaces/:workspaceId/projects",
    authenticate,
    createProject
);
router.get(
    "/workspaces/:workspaceId/projects",
    authenticate,
    getProjects
);

router.put(
    "/projects/:projectId",
    authenticate,
    updateProject
);

router.delete(
    "/projects/:projectId",
    authenticate,
    deleteProject
);



module.exports = router;