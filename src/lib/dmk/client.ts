"use client";

import {
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import type {
  DeviceManagementKit,
  DeviceSessionId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { Subscription } from "rxjs";
import { DeviceError } from "@/lib/errors";
import type { DeviceInfo } from "./types";

let dmkInstance: DeviceManagementKit | null = null;

/** Get or create the DMK singleton. Must be called client-side only. */
export function getDmk(): DeviceManagementKit {
  if (typeof window === "undefined") {
    throw new DeviceError("DMK can only be initialised in the browser");
  }

  if (!dmkInstance) {
    dmkInstance = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .build();
  }

  return dmkInstance;
}

/** Check if WebHID is available in this browser. */
export function isWebHidSupported(): boolean {
  return typeof navigator !== "undefined" && "hid" in navigator;
}

/**
 * Discover a Ledger device via WebHID.
 * Must be called from a user gesture (click handler).
 * Returns the first discovered device.
 */
export async function discoverDevice(): Promise<DiscoveredDevice> {
  const dmk = getDmk();

  return new Promise<DiscoveredDevice>((resolve, reject) => {
    let subscription: Subscription | null = null;

    const timeout = setTimeout(() => {
      subscription?.unsubscribe();
      void dmk.stopDiscovering();
      reject(new DeviceError("Device discovery timed out after 30 seconds"));
    }, 30_000);

    subscription = dmk.startDiscovering({}).subscribe({
      next: (device: DiscoveredDevice) => {
        clearTimeout(timeout);
        subscription?.unsubscribe();
        void dmk.stopDiscovering();
        resolve(device);
      },
      error: (error: unknown) => {
        clearTimeout(timeout);
        reject(new DeviceError("Failed to discover device", error));
      },
    });
  });
}

/** Connect to a discovered device. Returns a session ID. */
export async function connectDevice(
  device: DiscoveredDevice
): Promise<DeviceSessionId> {
  const dmk = getDmk();

  try {
    const sessionId = await dmk.connect({ device });
    return sessionId;
  } catch (error) {
    throw new DeviceError("Failed to connect to device", error);
  }
}

/** Get safe-to-display device info. Never exposes session ID or serial. */
export function getDeviceInfo(sessionId: DeviceSessionId): DeviceInfo {
  const dmk = getDmk();
  const connected = dmk.getConnectedDevice({ sessionId });

  return {
    modelId: connected.modelId,
    name: connected.type,
  };
}

/** Disconnect a device session. */
export async function disconnectDevice(
  sessionId: DeviceSessionId
): Promise<void> {
  const dmk = getDmk();

  try {
    await dmk.disconnect({ sessionId });
  } catch (error) {
    throw new DeviceError("Failed to disconnect device", error);
  }
}

/** Tear down the DMK instance entirely. */
export function closeDmk(): void {
  if (dmkInstance) {
    dmkInstance.close();
    dmkInstance = null;
  }
}
