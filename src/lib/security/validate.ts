import { z } from "zod";
import { ValidationError } from "@/lib/errors";

const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"];

/** Validate an RPC URL — must be HTTPS, no localhost in production. */
export function validateRpcUrl(url: string): string {
  const schema = z.string().url();
  const parsed = schema.safeParse(url);

  if (!parsed.success) {
    throw new ValidationError(`Invalid RPC URL: ${url}`);
  }

  let urlObj: URL;
  try {
    urlObj = new URL(parsed.data);
  } catch {
    throw new ValidationError(`Malformed RPC URL: ${url}`);
  }

  if (urlObj.protocol !== "https:") {
    throw new ValidationError(`RPC URL must use HTTPS: ${url}`);
  }

  const isProduction = typeof window !== "undefined" && window.location.protocol === "https:";
  if (isProduction && BLOCKED_HOSTS.includes(urlObj.hostname)) {
    throw new ValidationError(`RPC URL must not point to localhost in production: ${url}`);
  }

  return parsed.data;
}
