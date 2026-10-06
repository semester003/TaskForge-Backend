const request = require("supertest");
const app = require("../src/app");

describe("Health Check API", () => {
    test("GET /api/v1/health should return 200", async () => {
        const response = await request(app)
            .get("/api/v1/health");

        expect(response.statusCode).toBe(200);
    });
});