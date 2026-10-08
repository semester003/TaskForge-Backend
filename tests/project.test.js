const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const {
    createAuthenticatedUser,
    deleteTestUser,
} = require("./helpers/auth");

describe("Project API", () => {
    let owner;
    let otherUser;

    let ownerToken;
    let otherUserToken;

    let workspaceId;
    let projectId;

    beforeAll(async () => {
        const ownerAuth = await createAuthenticatedUser();
        const otherUserAuth = await createAuthenticatedUser();

        owner = ownerAuth.user;
        otherUser = otherUserAuth.user;

        ownerToken = ownerAuth.token;
        otherUserToken = otherUserAuth.token;

        // Create workspace
        const workspaceResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Project Test Workspace",
            });

        workspaceId = workspaceResponse.body.data.id;

        // Create a project
        const projectResponse = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Initial Project",
                description: "Project used for integration testing",
            });

        projectId = projectResponse.body.data.id;
    });

    afterAll(async () => {
        await deleteTestUser(owner.email);
        await deleteTestUser(otherUser.email);
    });

    test("should create a project successfully", async () => {
        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "New Project",
                description: "A test project",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("New Project");
        expect(response.body.data.workspaceId).toBe(workspaceId);
    });

    test("should reject project creation by a non-member", async () => {
        const response = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${otherUserToken}`)
            .send({
                name: "Unauthorized Project",
                description: "Should not be created",
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("should return projects for a workspace member", async () => {
        const response = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(
            response.body.data.some(
                (project) => project.id === projectId
            )
        ).toBe(true);
    });

    test("should reject project listing by a non-member", async () => {
        const response = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${otherUserToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("should update a project for a workspace member", async () => {
        const response = await request(app)
            .put(`/api/v1/projects/${projectId}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Updated Project",
                description: "Updated description",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Updated Project");
        expect(response.body.data.description).toBe(
            "Updated description"
        );
    });

    test("should reject project update by a non-member", async () => {
        const response = await request(app)
            .put(`/api/v1/projects/${projectId}`)
            .set("Authorization", `Bearer ${otherUserToken}`)
            .send({
                name: "Unauthorized Update",
                description: "Should not work",
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should delete a project for a workspace member", async () => {
        const createResponse = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Project To Delete",
                description: "Temporary project",
            });

        const temporaryProjectId = createResponse.body.data.id;

        const response = await request(app)
            .delete(`/api/v1/projects/${temporaryProjectId}`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const project = await prisma.project.findUnique({
            where: {
                id: temporaryProjectId,
            },
        });

        expect(project).toBeNull();
    });

    test("should reject project deletion by a non-member", async () => {
        const response = await request(app)
            .delete(`/api/v1/projects/${projectId}`)
            .set("Authorization", `Bearer ${otherUserToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });
});