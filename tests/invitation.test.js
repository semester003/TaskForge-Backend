const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const {
    createAuthenticatedUser,
    deleteTestUser,
} = require("./helpers/auth");

describe("Workspace Invitation API", () => {
    let owner;
    let invitedUserA;
    let invitedUserB;
    let otherUser;

    let ownerToken;
    let invitedUserAToken;
    let invitedUserBToken;
    let otherUserToken;

    let workspaceId;

    beforeAll(async () => {
        // Create test users
        const ownerAuth = await createAuthenticatedUser();
        const invitedAAuth = await createAuthenticatedUser();
        const invitedBAuth = await createAuthenticatedUser();
        const otherAuth = await createAuthenticatedUser();

        owner = ownerAuth.user;
        invitedUserA = invitedAAuth.user;
        invitedUserB = invitedBAuth.user;
        otherUser = otherAuth.user;

        ownerToken = ownerAuth.token;
        invitedUserAToken = invitedAAuth.token;
        invitedUserBToken = invitedBAuth.token;
        otherUserToken = otherAuth.token;

        // Create workspace as owner
        const workspaceResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Invitation Test Workspace",
            });

        workspaceId = workspaceResponse.body.data.id;
    });

    afterAll(async () => {
        await deleteTestUser(owner.email);
        await deleteTestUser(invitedUserA.email);
        await deleteTestUser(invitedUserB.email);
        await deleteTestUser(otherUser.email);
    });

    test("should allow the workspace owner to create an invitation", async () => {
        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                email: invitedUserA.email,
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.invitedUserId).toBeDefined();
        expect(response.body.data.workspaceId).toBe(workspaceId);
        expect(response.body.data.status).toBe("PENDING");
    });

    test("should reject an invalid invitation email", async () => {
        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                email: "not-an-email",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
    });

    test("should reject an invitation for a user that does not exist", async () => {
        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                email: "does-not-exist@test.com",
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should reject a regular member from creating invitations", async () => {
        // First accept the existing invitation for invitedUserA.
        const invitation = await prisma.workspaceInvitation.findFirst({
            where: {
                workspaceId,
                invitedUserId: (
                    await prisma.user.findUnique({
                        where: {
                            email: invitedUserA.email,
                        },
                    })
                ).id,
                status: "PENDING",
            },
        });

        await request(app)
            .post(`/api/v1/workspaces/invitations/${invitation.id}/accept`)
            .set("Authorization", `Bearer ${invitedUserAToken}`);

        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${invitedUserAToken}`)
            .send({
                email: otherUser.email,
            });

        expect(response.statusCode).toBe(403);
    });

    test("should return pending invitations for the invited user", async () => {
        const createResponse = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                email: invitedUserB.email,
            });

        const invitationId = createResponse.body.data.id;

        const response = await request(app)
            .get("/api/v1/workspaces/invitations")
            .set("Authorization", `Bearer ${invitedUserBToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const invitationIds = response.body.data.map(
            (invitation) => invitation.id
        );

        expect(invitationIds).toContain(invitationId);
    });

    test("should reject an invitation when another user tries to accept it", async () => {
        const invitation = await prisma.workspaceInvitation.findFirst({
            where: {
                workspaceId,
                invitedUserId: (
                    await prisma.user.findUnique({
                        where: {
                            email: invitedUserB.email,
                        },
                    })
                ).id,
                status: "PENDING",
            },
        });

        const response = await request(app)
            .post(`/api/v1/workspaces/invitations/${invitation.id}/accept`)
            .set("Authorization", `Bearer ${otherUserToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should allow the invited user to accept an invitation", async () => {
        const invitation = await prisma.workspaceInvitation.findFirst({
            where: {
                workspaceId,
                invitedUserId: (
                    await prisma.user.findUnique({
                        where: {
                            email: invitedUserB.email,
                        },
                    })
                ).id,
                status: "PENDING",
            },
        });

        const response = await request(app)
            .post(`/api/v1/workspaces/invitations/${invitation.id}/accept`)
            .set("Authorization", `Bearer ${invitedUserBToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.userId).toBe(invitation.invitedUserId);
        expect(response.body.data.workspaceId).toBe(workspaceId);

        const updatedInvitation =
            await prisma.workspaceInvitation.findUnique({
                where: {
                    id: invitation.id,
                },
            });

        expect(updatedInvitation.status).toBe("ACCEPTED");
    });

    test("should allow the invited user to reject an invitation", async () => {
        const createResponse = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/invitations`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                email: otherUser.email,
            });

        const invitationId = createResponse.body.data.id;

        const response = await request(app)
            .post(`/api/v1/workspaces/invitations/${invitationId}/reject`)
            .set("Authorization", `Bearer ${otherUserToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const updatedInvitation =
            await prisma.workspaceInvitation.findUnique({
                where: {
                    id: invitationId,
                },
            });

        expect(updatedInvitation.status).toBe("REJECTED");
    });
});