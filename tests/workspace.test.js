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
});