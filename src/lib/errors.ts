/** Base error class for all VaultView errors. Never throw raw strings. */
export class VaultViewError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "VaultViewError";
  }
}

export class DeviceError extends VaultViewError {
  constructor(message: string, cause?: unknown) {
    super(message, "DEVICE_ERROR", cause);
    this.name = "DeviceError";
  }
}

export class NetworkError extends VaultViewError {
  constructor(message: string, cause?: unknown) {
    super(message, "NETWORK_ERROR", cause);
    this.name = "NetworkError";
  }
}

export class ValidationError extends VaultViewError {
  constructor(message: string, cause?: unknown) {
    super(message, "VALIDATION_ERROR", cause);
    this.name = "ValidationError";
  }
}
