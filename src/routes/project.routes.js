const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
} = require("../controllers/project.controller");

const {
    createProjectSchema,
    updateProjectSchema,
} = require("../validations/project.validation");

router.post(
    "/workspaces/:workspaceId/projects",
    authenticate,
    validate(createProjectSchema),
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
    validate(updateProjectSchema),
    updateProject
);

router.delete(
    "/projects/:projectId",
    authenticate,
    deleteProject
);

module.exports = router;