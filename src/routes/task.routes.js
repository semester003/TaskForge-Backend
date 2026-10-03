const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    unassignTask,
} = require("../controllers/task.controller");

const {
    createTaskSchema,
    updateTaskSchema,
    assignTaskSchema,
} = require("../validations/task.validation");

// Create task
router.post(
    "/projects/:projectId/tasks",
    authenticate,
    validate(createTaskSchema),
    createTask
);

// Get all tasks of project
router.get(
    "/projects/:projectId/tasks",
    authenticate,
    getTasks
);

// Get single task
router.get(
    "/tasks/:taskId",
    authenticate,
    getTaskById
);

// Update task
router.put(
    "/tasks/:taskId",
    authenticate,
    validate(updateTaskSchema),
    updateTask
);

// Delete task
router.delete(
    "/tasks/:taskId",
    authenticate,
    deleteTask
);

// Assign task
router.patch(
    "/tasks/:taskId/assign",
    authenticate,
    validate(assignTaskSchema),
    assignTask
);

// Unassign task
router.patch(
    "/tasks/:taskId/unassign",
    authenticate,
    unassignTask
);

module.exports = router;