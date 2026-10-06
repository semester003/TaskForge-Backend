const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/config/prisma");

async function createAuthenticatedUser() {
    const user = {
        name: "Integration Test User",
        email: `integration-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}@test.com`,
        password: "TestPassword123",
    };

    const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(user);

    if (registerResponse.statusCode !== 201) {
        throw new Error(
            `Test user registration failed: ${JSON.stringify(
                registerResponse.body
            )}`
        );
    }

    const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: user.email,
            password: user.password,
        });

    if (loginResponse.statusCode !== 200) {
        throw new Error(
            `Test user login failed: ${JSON.stringify(
                loginResponse.body
            )}`
        );
    }

    return {
        user,
        token: loginResponse.body.token,
    };
}

async function deleteTestUser(email) {
    await prisma.user.delete({
        where: {
            email,
        },
    });
}

module.exports = {
    createAuthenticatedUser,
    deleteTestUser,
};