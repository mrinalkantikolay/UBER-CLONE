/**
 * Example integration test scaffold.
 *
 * This file is a non-executing example (depends on test runner
 * configuration). It demonstrates how to test the auth endpoints
 * against a running instance or a test server.
 */

import request from "supertest";
import app from "../../src/app";

describe("Auth integration (example)", () => {
  test("health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});
