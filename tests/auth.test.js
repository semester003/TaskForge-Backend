const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Authentication API", () => {
    const testUser = {
        name: "Integration Test User",
        email: `integration-${Date.now()}@test.com`,
        password: "TestPassword123",
    };

    afterAll(async () => {
        await prisma.user.delete({
            where: {
                email: testUser.email,
            },
        });

    });

    test("should register a new user and login successfully", async () => {
        const registerResponse = await request(app)
            .post("/api/v1/auth/register")
            .send(testUser);

        expect(registerResponse.statusCode).toBe(201);
        expect(registerResponse.body.success).toBe(true);
        expect(registerResponse.body.data.email).toBe(testUser.email);

        const userInDatabase = await prisma.user.findUnique({
            where: {
                email: testUser.email,
            },
        });

        expect(userInDatabase).not.toBeNull();
        expect(userInDatabase.email).toBe(testUser.email);
        expect(userInDatabase.password).not.toBe(testUser.password);

        const loginResponse = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.token).toBeDefined();
        expect(loginResponse.body.data.email).toBe(testUser.email);
    });
});