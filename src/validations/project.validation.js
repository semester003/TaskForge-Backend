const { z } = require("zod");

const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Project name is required"),

    description: z
        .string()
        .trim()
        .optional(),
});

const updateProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Project name is required"),

    description: z
        .string()
        .trim()
        .optional(),
});

module.exports = {
    createProjectSchema,
    updateProjectSchema,
};