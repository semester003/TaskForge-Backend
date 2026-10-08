const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

const {
    createAuthenticatedUser,
    deleteTestUser,
} = require("./helpers/auth");

describe("Task API", () => {
    let owner;
    let member;
    let outsider;

    let ownerToken;
    let memberToken;
    let outsiderToken;

    let workspaceId;
    let projectId;
    let taskId;

    beforeAll(async () => {
        const ownerAuth = await createAuthenticatedUser();
        const memberAuth = await createAuthenticatedUser();
        const outsiderAuth = await createAuthenticatedUser();

        owner = ownerAuth.user;
        member = memberAuth.user;
        outsider = outsiderAuth.user;

        ownerToken = ownerAuth.token;
        memberToken = memberAuth.token;
        outsiderToken = outsiderAuth.token;

        // Create workspace
        const workspaceResponse = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Task Test Workspace",
            });

        workspaceId = workspaceResponse.body.data.id;

        // Add member directly through Prisma.
        // The actual API uses invitations for adding members.
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: member.email,
            },
        });

        await prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId: memberRecord.id,
                role: "MEMBER",
            },
        });

        // Create project
        const projectResponse = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/projects`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Task Test Project",
                description: "Project for task integration tests",
            });

        projectId = projectResponse.body.data.id;

        // Create initial task
        const taskResponse = await request(app)
            .post(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Initial Task",
            });

        taskId = taskResponse.body.data.id;
    });

    afterAll(async () => {
        await deleteTestUser(owner.email);
        await deleteTestUser(member.email);
        await deleteTestUser(outsider.email);
    });

    test("should create a task successfully", async () => {
        const response = await request(app)
            .post(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "New Task",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe("New Task");
        expect(response.body.data.projectId).toBe(projectId);
    });

    test("should reject an invalid task", async () => {
        const response = await request(app)
            .post(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
    });

    test("should reject task creation by a non-member", async () => {
        const response = await request(app)
            .post(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${outsiderToken}`)
            .send({
                title: "Unauthorized Task",
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should return tasks for a project member", async () => {
        const response = await request(app)
            .get(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${memberToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(
            response.body.data.some((task) => task.id === taskId)
        ).toBe(true);
    });

    test("should reject task listing by a non-member", async () => {
        const response = await request(app)
            .get(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${outsiderToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should get a task by id", async () => {
        const response = await request(app)
            .get(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(taskId);
    });

    test("should update a task successfully", async () => {
        const response = await request(app)
            .put(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Updated Task",
                completed: true,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe("Updated Task");
        expect(response.body.data.completed).toBe(true);
    });

    test("should support partial task updates", async () => {
        const response = await request(app)
            .put(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                completed: false,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.completed).toBe(false);
        expect(response.body.data.title).toBe("Updated Task");
    });

    test("should reject an invalid task update", async () => {
        const response = await request(app)
            .put(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                completed: "yes",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("should reject an empty task update", async () => {
        const response = await request(app)
            .put(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("should reject task access by a non-member", async () => {
        const response = await request(app)
            .get(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${outsiderToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should allow assigning a task to a workspace member", async () => {
        const memberRecord = await prisma.user.findUnique({
            where: {
                email: member.email,
            },
        });

        const response = await request(app)
            .patch(`/api/v1/tasks/${taskId}/assign`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                userId: memberRecord.id,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assigneeId).toBe(memberRecord.id);
    });

    test("should reject assigning a task to a non-member", async () => {
        const outsiderRecord = await prisma.user.findUnique({
            where: {
                email: outsider.email,
            },
        });

        const response = await request(app)
            .patch(`/api/v1/tasks/${taskId}/assign`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                userId: outsiderRecord.id,
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("should allow unassigning a task", async () => {
        const response = await request(app)
            .patch(`/api/v1/tasks/${taskId}/unassign`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assigneeId).toBeNull();
    });

    test("should reject task update by a non-member", async () => {
        const response = await request(app)
            .put(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${outsiderToken}`)
            .send({
                title: "Unauthorized Update",
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("should delete a task successfully", async () => {
        const createResponse = await request(app)
            .post(`/api/v1/projects/${projectId}/tasks`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Task To Delete",
            });

        const temporaryTaskId = createResponse.body.data.id;

        const response = await request(app)
            .delete(`/api/v1/tasks/${temporaryTaskId}`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const task = await prisma.task.findUnique({
            where: {
                id: temporaryTaskId,
            },
        });

        expect(task).toBeNull();
    });

    test("should reject task deletion by a non-member", async () => {
        const response = await request(app)
            .delete(`/api/v1/tasks/${taskId}`)
            .set("Authorization", `Bearer ${outsiderToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });
});