import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/server";

describe("API service", () => {
  it("exposes a basic service descriptor without contacting the chain", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Automotive Compliance API");
    expect(response.body.health).toBe("/api/health");
  });
  it("requires a selected local demo identity for API routes", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(401);
    expect(response.body.error).toContain("demo account");
  });
});
