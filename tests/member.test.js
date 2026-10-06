const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const {
    createAuthenticatedUser,
    deleteTestUser,
} = require("./helpers/auth");

describe("Workspace Members and RBAC API", () => {
    let owner;
    let memberA;
    let memberB;
    let ownerToken;
    let memberAToken;
    let memberBToken;
    let workspaceId;

    beforeAll(async () => {
        // Create three authenticated users
        const ownerAuth = await createAuthenticatedUser();
        const memberAAuth = await createAuthenticatedUser();
        const memberBAuth = await createAuthenticatedUser();

        owner = ownerAuth.user;
        memberA = memberAAuth.user;
        memberB = memberBAuth.user;

        ownerToken = ownerAuth.token;
        memberAToken = memberAAuth.token;
        memberBToken = memberBAuth.token;

        // Create workspace as owner
        const workspaceResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "RBAC Test Workspace",
            });

        workspaceId = workspaceResponse.body.data.id;

        // Find test users in the database
        const memberARecord = await prisma.user.findUnique({
            where: {
                email: memberA.email,
            },
        });

        const memberBRecord = await prisma.user.findUnique({
            where: {
                email: memberB.email,
            },
        });

        // Add them as workspace members.
        // This is test setup; the actual member-management
        // behavior is tested through the API below.
        await prisma.workspaceMember.createMany({
            data: [
                {
                    workspaceId,
                    userId: memberARecord.id,
                    role: "MEMBER",
                },
                {
                    workspaceId,
                    userId: memberBRecord.id,
                    role: "MEMBER",
                },
            ],
        });
    });

    afterAll(async () => {
        await deleteTestUser(owner.email);
        await deleteTestUser(memberA.email);
        await deleteTestUser(memberB.email);
    });

    test("should allow a workspace member to view workspace members", async () => {
        const response = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}/members`)
            .set("Authorization", `Bearer ${memberAToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toHaveLength(3);
    });

    test("should allow the owner to change a member role", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: memberA.email,
            },
        });

        const response = await request(app)
            .patch(
                `/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`
            )
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                role: "ADMIN",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe("ADMIN");
    });

    test("should reject a member trying to change another member's role", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: memberB.email,
            },
        });

        const response = await request(app)
            .patch(
                `/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`
            )
            .set("Authorization", `Bearer ${memberAToken}`)
            .send({
                role: "ADMIN",
            });

        expect(response.statusCode).toBe(403);
    });

    test("should reject an invalid member role", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: memberA.email,
            },
        });

        const response = await request(app)
            .patch(
                `/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`
            )
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                role: "SUPERADMIN",
            });

        expect(response.statusCode).toBe(400);
    });

    test("should allow the owner to remove a member", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: memberA.email,
            },
        });

        const response = await request(app)
            .delete(
                `/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`
            )
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test("should reject a member trying to remove another member", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: memberB.email,
            },
        });

        const response = await request(app)
            .delete(
                `/api/v1/workspaces/${workspaceId}/members/${memberRecord.id}`
            )
            .set("Authorization", `Bearer ${memberBToken}`);

        expect(response.statusCode).toBe(403);
    });

    test("should reject the owner from leaving the workspace", async () => {
        const response = await request(app)
            .delete(`/api/v1/workspaces/${workspaceId}/leave`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(400);
    });

    test("should allow a member to leave the workspace", async () => {
        const response = await request(app)
            .delete(`/api/v1/workspaces/${workspaceId}/leave`)
            .set("Authorization", `Bearer ${memberBToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
    });
});