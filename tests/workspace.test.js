const request = require("supertest");
const app = require("../src/app");

const {
    createAuthenticatedUser,
    deleteTestUser,
} = require("./helpers/auth");

describe("Workspace API", () => {
    let testUser;
    let token;

    beforeAll(async () => {
        const auth = await createAuthenticatedUser();

        testUser = auth.user;
        token = auth.token;
    });

    afterAll(async () => {
        await deleteTestUser(testUser.email);
    });

    test("should create a workspace successfully", async () => {
        const response = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Integration Workspace",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Integration Workspace");
    });

    test("should reject an empty workspace name", async () => {
        const response = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
    });

    test("should reject workspace creation without authentication", async () => {
        const response = await request(app)
            .post("/api/v1/workspaces")
            .send({
                name: "Unauthorized Workspace",
            });

        expect(response.statusCode).toBe(401);
    });

    test("should return the user's workspaces", async () => {
        const createResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Workspace List Test",
            });

        const workspaceId = createResponse.body.data.id;

        const response = await request(app)
            .get("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const workspaceIds = response.body.data.map(
            (membership) => membership.workspace.id
        );

        expect(workspaceIds).toContain(workspaceId);
    });

    test("should get a workspace by id", async () => {
        const createResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Get Workspace Test",
            });

        const workspaceId = createResponse.body.data.id;

        const response = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(workspaceId);
    });

    test("should update a workspace successfully", async () => {
        const createResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Before Update",
            });

        const workspaceId = createResponse.body.data.id;

        const response = await request(app)
            .put(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "After Update",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const getResponse = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(getResponse.body.data.name).toBe("After Update");
    });

    test("should reject an invalid workspace update", async () => {
        const createResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Valid Workspace",
            });

        const workspaceId = createResponse.body.data.id;

        const response = await request(app)
            .put(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("should delete a workspace successfully", async () => {
        const createResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Workspace To Delete",
            });

        const workspaceId = createResponse.body.data.id;

        const deleteResponse = await request(app)
            .delete(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteResponse.statusCode).toBe(200);
        expect(deleteResponse.body.success).toBe(true);

        const getResponse = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(getResponse.statusCode).toBe(404);
    });
});