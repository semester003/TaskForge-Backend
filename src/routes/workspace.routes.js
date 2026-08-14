const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

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

router.post("/", authenticate, createWorkspace);
router.get("/", authenticate, getMyWorkspaces);
router.put("/:id", authenticate, updateWorkspace);
router.delete("/:id", authenticate, deleteWorkspace);
router.post("/:id/invitations", authenticate, createInvitation);
router.get("/invitations", authenticate, getMyInvitations);
router.post("/invitations/:id/accept", authenticate, acceptInvitation);
router.post("/invitations/:id/reject", authenticate, rejectInvitation);
router.get("/:id/members", authenticate, getWorkspaceMembers);
router.delete("/:id/members/:userId", authenticate, removeMember);
router.patch("/:id/members/:userId", authenticate, updateMemberRole);
router.get("/:id", authenticate, getWorkspaceById);
router.delete("/:id/leave", authenticate, leaveWorkspace);

module.exports = router;