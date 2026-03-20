import { describe, it, expect } from "vitest";
import { sanitiseDisplayString } from "./sanitise";

describe("sanitiseDisplayString", () => {
  it("strips HTML-dangerous characters", () => {
    expect(sanitiseDisplayString('<script>alert("xss")</script>')).toBe(
      "scriptalert(xss)/script"
    );
  });

  it("strips control characters", () => {
    expect(sanitiseDisplayString("hello\x00world\x1f")).toBe("helloworld");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(300);
    expect(sanitiseDisplayString(long)).toHaveLength(256);
    expect(sanitiseDisplayString(long, 10)).toHaveLength(10);
  });

  it("trims whitespace", () => {
    expect(sanitiseDisplayString("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitiseDisplayString("")).toBe("");
  });

  it("passes through safe strings unchanged", () => {
    expect(sanitiseDisplayString("https://eth-mainnet.g.alchemy.com/v2/key123")).toBe(
      "https://eth-mainnet.g.alchemy.com/v2/key123"
    );
  });
});
