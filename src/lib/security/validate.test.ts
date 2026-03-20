import { describe, it, expect } from "vitest";
import { validateRpcUrl } from "./validate";

describe("validateRpcUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(validateRpcUrl("https://eth-mainnet.g.alchemy.com/v2/abc123")).toBe(
      "https://eth-mainnet.g.alchemy.com/v2/abc123"
    );
  });

  it("rejects HTTP URLs", () => {
    expect(() => validateRpcUrl("http://example.com")).toThrow("HTTPS");
  });

  it("rejects invalid URLs", () => {
    expect(() => validateRpcUrl("not-a-url")).toThrow("Invalid RPC URL");
  });

  it("rejects empty string", () => {
    expect(() => validateRpcUrl("")).toThrow("Invalid RPC URL");
  });

  it("rejects FTP URLs", () => {
    expect(() => validateRpcUrl("ftp://example.com")).toThrow("HTTPS");
  });
});
