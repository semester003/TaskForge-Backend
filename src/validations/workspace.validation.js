const { z } = require("zod");

const createWorkspaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Workspace name is required"),
});

const updateWorkspaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Workspace name is required"),
});

const createInvitationSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email"),
});

const updateMemberRoleSchema = z.object({
    role: z.enum(["ADMIN", "MEMBER"], {
        message: "Role must be either ADMIN or MEMBER",
    }),
});

module.exports = {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    createInvitationSchema,
    updateMemberRoleSchema,
};