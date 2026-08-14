const prisma = require("../config/prisma");

const createWorkspace = async (req, res) => {
    const { name } = req.body;

    const workspace = await prisma.workspace.create({
        data: {
            name,
            ownerId: req.user.userId,
            members: {
                create: {
                    userId: req.user.userId,
                    role: "OWNER",
                },
            },
        },
    });

    return res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        data: workspace,
    });
};

//"Give me the workspaces in which I am a member."
const getMyWorkspaces = async (req, res) => {  
    
    const memberships = await prisma.workspaceMember.findMany({
        where: {
            userId: req.user.userId,
        },
        include: {
            workspace: true,  // why? we also want the actual workspace information.
        },                    // "Along with the membership row, fetch the related Workspace."
    });

    return res.status(200).json({
        success: true,
        data: memberships,
    });
};

const updateWorkspace = async (req, res) => {

    const workspaceId = Number(req.params.id);

    const { name } = req.body;

    const workspace = await prisma.workspace.updateMany({
        where: {
            id: workspaceId,       //  this is the ownership check. Only the owner can update the workspace.
            ownerId: req.user.userId,
        },
        data: {
            name,
        },
    });

    if (workspace.count === 0) {
        return res.status(404).json({
            success: false,
            message: "Workspace not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Workspace updated successfully",
    });
};

const deleteWorkspace = async (req, res) => {

    const workspaceId = Number(req.params.id);

    const workspace = await prisma.workspace.deleteMany({
        where: {
            id: workspaceId,   // this is the ownership check. Only the owner can delete the workspace.
            ownerId: req.user.userId,
        },
    });

    if (workspace.count === 0) {
        return res.status(404).json({
            success: false,
            message: "Workspace not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Workspace deleted successfully",
    });
};

const createInvitation = async (req, res) => {
    const workspaceId = Number(req.params.id);
    const { email } = req.body;

     // 1. Check that the logged-in user either owns the workspace or is an admin
    const membership = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId: req.user.userId,
            role: {
                in: ["OWNER", "ADMIN"],
            },
        },
    });

    if (!membership) {
        return res.status(403).json({
            success: false,
            message: "Only workspace owner or admin can invite members",
        });
    }

    // 2. Find the user we want to invite
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    // 3. If the user doesn't exist, return an error
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    // 4. Create an invitation
    const invitation = await prisma.workspaceInvitation.create({
        data: {
            workspaceId,
            invitedUserId: user.id,
            invitedById: req.user.userId,
        },
    });

    return res.status(201).json({
        success: true,
        message: "Invitation sent successfully",
        data: invitation,
    });
};

const getMyInvitations = async (req, res) => {
    const invitations = await prisma.workspaceInvitation.findMany({
        where: {
            invitedUserId: req.user.userId,       // security check: only fetch invitations for the logged-in user
            status: "PENDING",
        },
        include: {          //include means "bring the related record", 
            workspace: true,
            invitedBy: {
                select:{    //but select means "bring only these fields from that record."
                    id: true,
                    name: true,
                    email: true,
                }
            }
        },
    });

    return res.status(200).json({
        success: true,
        data: invitations,
    });
};

const acceptInvitation = async (req, res) => {
    const invitationId = Number(req.params.id);

    const invitation = await prisma.workspaceInvitation.findFirst({
        where: {
            id: invitationId,
            invitedUserId: req.user.userId,
            status: "PENDING",
        },
    });

    if (!invitation) {
        return res.status(404).json({
            success: false,
            message: "Invitation not found",
        });
    }

    const membership = await prisma.workspaceMember.create({
        data: {
            userId: req.user.userId,
            workspaceId: invitation.workspaceId,
            role: "MEMBER",
        },
    });

    await prisma.workspaceInvitation.update({
        where: {
            id: invitationId,
        },
        data: {
            status: "ACCEPTED",
        },
    });

    return res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        data: membership,
    });
};

const rejectInvitation = async (req, res) => {
    const invitationId = Number(req.params.id);

    const invitation = await prisma.workspaceInvitation.findFirst({
        where: {
            id: invitationId,
            invitedUserId: req.user.userId,
            status: "PENDING",
        },
    });

    if (!invitation) {
        return res.status(404).json({
            success: false,
            message: "Invitation not found",
        });
    }

    await prisma.workspaceInvitation.update({
        where: {
            id: invitationId,
        },
        data: {
            status: "REJECTED",
        },
    });

    return res.status(200).json({
        success: true,
        message: "Invitation rejected successfully",
    });
};

const getWorkspaceMembers = async (req, res) => {
    const workspaceId = Number(req.params.id);

    // Check that the logged-in user belongs to this workspace
    const membership = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,                             // Any member can see the members of a workspace they're part of.
            userId: req.user.userId,
        },
    });

    if (!membership) {
        return res.status(403).json({
            success: false,
            message: "You are not a member of this workspace",
        });
    }

    const members = await prisma.workspaceMember.findMany({
        where: {
            workspaceId,
        },
        include: {
            user: {
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
        data: members,
    });
};

const removeMember = async (req, res) => { 
    const workspaceId = Number(req.params.id);    // the workspace from which the member is to be removed is specified in the URL as a parameter.
    const userId = Number(req.params.userId);   // the user to be removed is specified in the URL as a parameter.

    // Check that the logged-in user is the owner of the workspace
    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            ownerId: req.user.userId,
        },
    });

    if (!workspace) {
        return res.status(403).json({
            success: false,
            message: "Only the workspace owner can remove members",
        });
    }

    const member = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId,
        },
    });

    if (!member) {
        return res.status(404).json({
            success: false,
            message: "Member not found",
        });
    }

    if (member.role === "OWNER") {    // The owner cannot be removed through this endpoint.
        return res.status(400).json({
            success: false,
            message: "Workspace owner cannot be removed",
        });
    }

    await prisma.workspaceMember.delete({
        where: {
            id: member.id,
        },
    });

    return res.status(200).json({
        success: true,
        message: "Member removed successfully",
    });
};

const updateMemberRole = async (req, res) => {
    const workspaceId = Number(req.params.id);  // the workspace in which the member's role is to be updated is specified in the URL as a parameter.
    const userId = Number(req.params.userId);  // the user whose role is to be updated is specified in the URL as a parameter.
    const { role } = req.body;
 
    if (role !== "ADMIN" && role !== "MEMBER") {    // owner role cannot be assigned through this endpoint. Only ADMIN and MEMBER roles can be assigned.
        return res.status(400).json({
            success: false,
            message: "Invalid role",
        });
    }

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            ownerId: req.user.userId,
        },
    });

    if (!workspace) {
        return res.status(403).json({
            success: false,
            message: "Only the workspace owner can change roles",
        });
    }

    const member = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId,
        },
    });

    if (!member) {
        return res.status(404).json({
            success: false,
            message: "Member not found",
        });
    }

    if (member.role === "OWNER") {
        return res.status(400).json({
            success: false,
            message: "Owner role cannot be changed",
        });
    }

    const updatedMember = await prisma.workspaceMember.update({
        where: {
            id: member.id,
        },
        data: {
            role,
        },
    });

    return res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        data: updatedMember,
    });
};

const getWorkspaceById = async (req, res) => {
    const workspaceId = Number(req.params.id);

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            members: {     //  Find Workspace X where at least one WorkspaceMember belongs to the logged-in user.
                some: {
                    userId: req.user.userId,
                },
            },
        },
    });

    if (!workspace) {
        return res.status(404).json({
            success: false,
            message: "Workspace not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: workspace,
    });
};

const leaveWorkspace = async (req, res) => {
    const workspaceId = Number(req.params.id);

    const membership = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId: req.user.userId,
        },
    });

    if (!membership) {
        return res.status(404).json({
            success: false,
            message: "You are not a member of this workspace",
        });
    }

    if (membership.role === "OWNER") {
        return res.status(400).json({
            success: false,
            message: "Owner cannot leave the workspace",
        });
    }

    await prisma.workspaceMember.delete({
        where: {
            id: membership.id,
        },
    });

    return res.status(200).json({
        success: true,
        message: "You left the workspace successfully",
    });
};


module.exports = {
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
};