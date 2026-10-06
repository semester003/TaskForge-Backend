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
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return;
    }

    // Delete workspaces owned by this user.
    // Workspace deletion cascades to its related resources.
    await prisma.workspace.deleteMany({
        where: {
            ownerId: user.id,
        },
    });

    // Remove memberships in other workspaces.
    await prisma.workspaceMember.deleteMany({
        where: {
            userId: user.id,
        },
    });

    // Remove invitations involving this user.
    await prisma.workspaceInvitation.deleteMany({
        where: {
            OR: [
                { invitedUserId: user.id },
                { invitedById: user.id },
            ],
        },
    });

    await prisma.user.delete({
        where: {
            id: user.id,
        },
    });
}

module.exports = {
    createAuthenticatedUser,
    deleteTestUser,
};