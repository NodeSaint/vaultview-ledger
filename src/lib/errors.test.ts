import { describe, it, expect } from "vitest";
import {
  VaultViewError,
  DeviceError,
  NetworkError,
  ValidationError,
} from "./errors";

describe("error classes", () => {
  it("VaultViewError has correct name and code", () => {
    const err = new VaultViewError("test", "TEST_CODE");
    expect(err.name).toBe("VaultViewError");
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("test");
    expect(err).toBeInstanceOf(Error);
  });

  it("DeviceError extends VaultViewError", () => {
    const err = new DeviceError("disconnected");
    expect(err.name).toBe("DeviceError");
    expect(err.code).toBe("DEVICE_ERROR");
    expect(err).toBeInstanceOf(VaultViewError);
  });

  it("NetworkError extends VaultViewError", () => {
    const err = new NetworkError("timeout");
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err).toBeInstanceOf(VaultViewError);
  });

  it("ValidationError extends VaultViewError", () => {
    const err = new ValidationError("bad input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err).toBeInstanceOf(VaultViewError);
  });

  it("preserves cause", () => {
    const cause = new Error("original");
    const err = new DeviceError("wrapped", cause);
    expect(err.cause).toBe(cause);
  });
});
