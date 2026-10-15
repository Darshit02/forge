import { describe, it, expect } from "bun:test";
import { testerService } from "../src/services/tester.service.js";

describe("TesterService (SSRF Protection & Env Interpolation)", () => {
  const allowedPort = 8005;

  it("should permit valid localhost requests on the allocated port", () => {
    expect(() =>
      testerService.validateTargetUrl(`http://127.0.0.1:${allowedPort}/users`, allowedPort)
    ).not.toThrow();
  });

  it("should reject AWS/GCP metadata endpoints (169.254.169.254)", () => {
    expect(() =>
      testerService.validateTargetUrl(
        `http://169.254.169.254/latest/meta-data/`,
        allowedPort
      )
    ).toThrow();
  });

  it("should reject private networks (10.x, 192.168.x, 172.x)", () => {
    expect(() =>
      testerService.validateTargetUrl(`http://10.0.0.1:${allowedPort}/api`, allowedPort)
    ).toThrow();

    expect(() =>
      testerService.validateTargetUrl(
        `http://192.168.1.100:${allowedPort}/api`,
        allowedPort
      )
    ).toThrow();

    expect(() =>
      testerService.validateTargetUrl(
        `http://172.16.0.5:${allowedPort}/api`,
        allowedPort
      )
    ).toThrow();
  });

  it("should reject mismatched ports on 127.0.0.1", () => {
    expect(() =>
      testerService.validateTargetUrl(`http://127.0.0.1:5432/`, allowedPort)
    ).toThrow();
  });

  it("should interpolate environment variables formatted as {{VAR}}", () => {
    const vars = {
      TOKEN: "secret-bearer-123",
      VERSION: "v1",
    };

    const path = "/api/{{VERSION}}/users";
    const header = "Bearer {{TOKEN}}";

    expect(testerService.interpolateVariables(path, vars)).toBe("/api/v1/users");
    expect(testerService.interpolateVariables(header, vars)).toBe(
      "Bearer secret-bearer-123"
    );
  });
});
