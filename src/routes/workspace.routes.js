const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const {
    createWorkspace,
    getMyWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    createInvitation,
    getMyInvitations,
    acceptInvitation,
    rejectInvitation,
    getWorkspaceMembers,
    removeMember,
    updateMemberRole,
    leaveWorkspace,
} = require("../controllers/workspace.controller");

const {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    createInvitationSchema,
    updateMemberRoleSchema,
} = require("../validations/workspace.validation");

router.post(
    "/",
    authenticate,
    validate(createWorkspaceSchema),
    createWorkspace
);

router.get(
    "/",
    authenticate,
    getMyWorkspaces
);

router.put(
    "/:id",
    authenticate,
    validate(updateWorkspaceSchema),
    updateWorkspace
);

router.delete(
    "/:id",
    authenticate,
    deleteWorkspace
);

router.post(
    "/:id/invitations",
    authenticate,
    validate(createInvitationSchema),
    createInvitation
);

router.get(
    "/invitations",
    authenticate,
    getMyInvitations
);

router.post(
    "/invitations/:id/accept",
    authenticate,
    acceptInvitation
);

router.post(
    "/invitations/:id/reject",
    authenticate,
    rejectInvitation
);

router.get(
    "/:id/members",
    authenticate,
    getWorkspaceMembers
);

router.delete(
    "/:id/members/:userId",
    authenticate,
    removeMember
);

router.patch(
    "/:id/members/:userId",
    authenticate,
    validate(updateMemberRoleSchema),
    updateMemberRole
);

router.get(
    "/:id",
    authenticate,
    getWorkspaceById
);

router.delete(
    "/:id/leave",
    authenticate,
    leaveWorkspace
);

module.exports = router;