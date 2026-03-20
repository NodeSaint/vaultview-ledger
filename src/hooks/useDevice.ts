"use client";

import { useCallback, useEffect, useRef, useReducer } from "react";
import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import {
  discoverDevice,
  connectDevice,
  getDeviceInfo,
  disconnectDevice,
  closeDmk,
  deriveEthAddress,
  deriveSolAddress,
} from "@/lib/dmk";
import type {
  DeviceState,
  DeviceConnectionStatus,
  DeviceInfo,
  ChainAddress,
} from "@/lib/dmk";

type DeviceAction =
  | { type: "SET_STATUS"; status: DeviceConnectionStatus }
  | { type: "CONNECTED"; sessionId: DeviceSessionId; device: DeviceInfo }
  | { type: "ADDRESS_DERIVED"; address: ChainAddress }
  | { type: "DISCONNECTED" }
  | { type: "ERROR"; message: string };

const initialState: DeviceState = {
  status: "disconnected",
  device: null,
  sessionId: null,
  addresses: [],
  error: null,
};

function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status, error: null };
    case "CONNECTED":
      return {
        ...state,
        status: "connected",
        sessionId: action.sessionId,
        device: action.device,
        error: null,
      };
    case "ADDRESS_DERIVED":
      return {
        ...state,
        addresses: [
          ...state.addresses.filter(
            (a) => a.chain !== action.address.chain
          ),
          action.address,
        ],
      };
    case "DISCONNECTED":
      return { ...initialState };
    case "ERROR":
      return { ...state, status: "error", error: action.message };
  }
}

export function useDevice() {
  const [state, dispatch] = useReducer(deviceReducer, initialState);
  const sessionRef = useRef<DeviceSessionId | null>(null);

  /** Connect to a Ledger device. Must be called from a user gesture. */
  const connect = useCallback(async () => {
    try {
      dispatch({ type: "SET_STATUS", status: "discovering" });

      const device = await discoverDevice();

      dispatch({ type: "SET_STATUS", status: "connecting" });
      const sessionId = await connectDevice(device);
      sessionRef.current = sessionId;

      const info = getDeviceInfo(sessionId);
      dispatch({ type: "CONNECTED", sessionId, device: info });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown connection error";
      dispatch({ type: "ERROR", message });
    }
  }, []);

  /** Derive addresses for all supported chains. */
  const deriveAddresses = useCallback(async () => {
    const sessionId = sessionRef.current;
    if (!sessionId) return;

    try {
      // Derive ETH and SOL in parallel
      const results = await Promise.allSettled([
        deriveEthAddress(sessionId),
        deriveSolAddress(sessionId),
      ]);

      for (const result of results) {
        if (result.status === "fulfilled") {
          dispatch({ type: "ADDRESS_DERIVED", address: result.value });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Address derivation failed";
      dispatch({ type: "ERROR", message });
    }
  }, []);

  /** Disconnect from the device. */
  const disconnect = useCallback(async () => {
    const sessionId = sessionRef.current;
    if (!sessionId) return;

    try {
      await disconnectDevice(sessionId);
    } catch {
      // Best-effort disconnect
    } finally {
      sessionRef.current = null;
      dispatch({ type: "DISCONNECTED" });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeDmk();
    };
  }, []);

  return {
    ...state,
    connect,
    deriveAddresses,
    disconnect,
  };
}
