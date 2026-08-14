const prisma = require("../config/prisma");

// CREATE TASK
const createTask = async (req, res) => {
    const projectId = Number(req.params.projectId);
    const { title } = req.body;

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            workspace: {
                members: {
                    some: {
                        userId: req.user.userId,
                    },
                },
            },
        },
    });

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        });
    }

    const task = await prisma.task.create({
        data: {
            title,
            projectId,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
    });
};


// GET TASKS OF A PROJECT
const getTasks = async (req, res) => {
    const projectId = Number(req.params.projectId);

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            workspace: {
                members: {
                    some: {
                        userId: req.user.userId,
                    },
                },
            },
        },
    });

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        });
    }

    const tasks = await prisma.task.findMany({
        where: {
            projectId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(200).json({
        success: true,
        data: tasks,
    });
};


// GET SINGLE TASK
const getTaskById = async (req, res) => {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                workspace: {
                    members: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                },
            },
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: task,
    });
};


// UPDATE TASK
const updateTask = async (req, res) => {
    const taskId = Number(req.params.taskId);
    const { title, completed } = req.body;

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                workspace: {
                    members: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            title,
            completed,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
    });
};


// DELETE TASK
const deleteTask = async (req, res) => {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findFirst({  // We are checking if the task exists and if the user making the request is a member of the workspace to which the task belongs.
        where: {
            id: taskId,
            project: {
                workspace: {
                    members: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    await prisma.task.delete({
        where: {
            id: taskId,
        },
    });

    return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
    });
};


///////////////////////////////////////////

// ASSIGN TASK
const assignTask = async (req, res) => {
    const taskId = Number(req.params.taskId);
    const { userId } = req.body;  // We are expecting the userId of the user to whom the task is to be assigned in the request body.

    const task = await prisma.task.findFirst({     // We are checking if the task exists and if the user making the request is a member of the workspace to which the task belongs.
        where: {
            id: taskId,
            project: {
                workspace: {
                    members: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                },
            },
        },
        include: {
            project: {
                select: {
                    workspaceId: true,
                },
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    const member = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId: task.project.workspaceId,
            userId,
        },
    });

    if (!member) {
        return res.status(400).json({
            success: false,
            message: "User is not a member of this workspace",
        });
    }

    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            assigneeId: userId,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(200).json({
        success: true,
        message: "Task assigned successfully",
        data: updatedTask,
    });
};


// UNASSIGN TASK
const unassignTask = async (req, res) => {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                workspace: {
                    members: {
                        some: {
                            userId: req.user.userId,
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        return res.status(404).json({
            success: false,
            message: "Task not found",
        });
    }

    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            assigneeId: null,
        },
    });

    return res.status(200).json({
        success: true,
        message: "Task unassigned successfully",
        data: updatedTask,
    });
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask, 
    deleteTask,
    assignTask,
    unassignTask,
};