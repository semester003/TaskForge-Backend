const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    unassignTask,
} = require("../controllers/task.controller");


// Create task
router.post(
    "/projects/:projectId/tasks",
    authenticate,
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
    updateTask
);


// Delete task
router.delete(
    "/tasks/:taskId",
    authenticate,
    deleteTask
);

router.patch(
    "/tasks/:taskId/assign",
    authenticate,
    assignTask
);

router.patch(
    "/tasks/:taskId/unassign",
    authenticate,
    unassignTask
);


module.exports = router;