const { z } = require("zod");

const createTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Task title is required"),
});

const updateTaskSchema = z
    .object({
        title: z.string().trim().min(1, "Task title is required").optional(),
        completed: z.boolean().optional(),
    })
    .refine(
        (data) => data.title !== undefined || data.completed !== undefined,
        {
            message: "At least one field is required",
        }
    );

const assignTaskSchema = z.object({
    userId: z
        .number()
        .int()
        .positive("User ID must be a positive integer"),
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    assignTaskSchema,
};