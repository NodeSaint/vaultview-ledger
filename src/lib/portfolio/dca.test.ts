import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadDcaEntries,
  addDcaEntry,
  deleteDcaEntry,
  calculateCostBasis,
  calculateUnrealisedPnl,
  getDcaSummary,
} from "./dca";

// Mock localStorage
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key));
  }),
  clear: vi.fn(() => {
    store = {};
  }),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID
let uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: vi.fn(() => {
      uuidCounter += 1;
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, "0")}`;
    }),
  },
  writable: true,
});

describe("DCA module", () => {
  beforeEach(() => {
    store = {};
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  describe("loadDcaEntries", () => {
    it("returns empty array when nothing stored", () => {
      expect(loadDcaEntries()).toEqual([]);
    });

    it("returns empty array on corrupted data", () => {
      store.vaultview_dca_entries = "not json";
      expect(loadDcaEntries()).toEqual([]);
    });
  });

  describe("addDcaEntry", () => {
    it("adds an entry and calculates totalCost", () => {
      const entry = addDcaEntry({
        asset: "ETH",
        amount: 1.5,
        priceAtPurchase: 2000,
        date: "2026-01-15T00:00:00.000Z",
      });

      expect(entry.totalCost).toBe(3000);
      expect(entry.asset).toBe("ETH");
      expect(entry.id).toBeDefined();
    });

    it("persists to localStorage", () => {
      addDcaEntry({
        asset: "SOL",
        amount: 10,
        priceAtPurchase: 100,
        date: "2026-01-15T00:00:00.000Z",
      });

      const entries = loadDcaEntries();
      expect(entries).toHaveLength(1);
      const first = entries[0];
      expect(first?.asset).toBe("SOL");
    });
  });

  describe("deleteDcaEntry", () => {
    it("removes entry by ID", () => {
      const entry = addDcaEntry({
        asset: "ETH",
        amount: 1,
        priceAtPurchase: 2000,
        date: "2026-01-15T00:00:00.000Z",
      });

      deleteDcaEntry(entry.id);
      expect(loadDcaEntries()).toHaveLength(0);
    });
  });

  describe("calculateCostBasis", () => {
    it("calculates average cost correctly", () => {
      addDcaEntry({ asset: "ETH", amount: 1, priceAtPurchase: 2000, date: "2026-01-01T00:00:00.000Z" });
      addDcaEntry({ asset: "ETH", amount: 1, priceAtPurchase: 3000, date: "2026-02-01T00:00:00.000Z" });

      const basis = calculateCostBasis("ETH");
      expect(basis.totalInvested).toBe(5000);
      expect(basis.totalAmount).toBe(2);
      expect(basis.averageCost).toBe(2500);
      expect(basis.entryCount).toBe(2);
    });

    it("returns zeros for unknown asset", () => {
      const basis = calculateCostBasis("UNKNOWN");
      expect(basis.totalInvested).toBe(0);
      expect(basis.totalAmount).toBe(0);
      expect(basis.averageCost).toBe(0);
    });
  });

  describe("calculateUnrealisedPnl", () => {
    it("calculates profit correctly", () => {
      addDcaEntry({ asset: "ETH", amount: 2, priceAtPurchase: 2000, date: "2026-01-01T00:00:00.000Z" });

      const pnl = calculateUnrealisedPnl("ETH", 3000);
      expect(pnl.unrealisedPnl).toBe(2000);
      expect(pnl.unrealisedPnlPercent).toBe(50);
    });

    it("calculates loss correctly", () => {
      addDcaEntry({ asset: "ETH", amount: 2, priceAtPurchase: 2000, date: "2026-01-01T00:00:00.000Z" });

      const pnl = calculateUnrealisedPnl("ETH", 1500);
      expect(pnl.unrealisedPnl).toBe(-1000);
      expect(pnl.unrealisedPnlPercent).toBe(-25);
    });
  });

  describe("getDcaSummary", () => {
    it("groups entries by asset", () => {
      addDcaEntry({ asset: "ETH", amount: 1, priceAtPurchase: 2000, date: "2026-01-01T00:00:00.000Z" });
      addDcaEntry({ asset: "SOL", amount: 10, priceAtPurchase: 100, date: "2026-01-01T00:00:00.000Z" });

      const summary = getDcaSummary();
      expect(summary).toHaveLength(2);
    });
  });
});
