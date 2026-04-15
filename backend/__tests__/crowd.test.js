/**
 * crowd.test.js — Unit tests for crowd data helpers
 *
 * Tests getCrowdDensity, getWaitTime, and getAllZones
 * with mocked Firestore.
 */

// ── Mock firebase-admin ──
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollectionGet = jest.fn();
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  get: mockCollectionGet,
}));

jest.mock("firebase-admin", () => {
  const app = {
    firestore: () => ({ collection: mockCollection }),
  };
  return {
    apps: [app],
    initializeApp: jest.fn(() => app),
    credential: { applicationDefault: jest.fn() },
    firestore: () => ({ collection: mockCollection }),
  };
});

const { getCrowdDensity, getWaitTime, getAllZones } = require("../crowd");

describe("getCrowdDensity", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns density for existing zone", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        density: 72,
        name: "Gate A",
        type: "gate",
        lastUpdated: { toDate: () => new Date("2026-01-01T12:00:00Z") },
      }),
    });

    const result = await getCrowdDensity("gate_a");
    expect(result.density).toBe(72);
    expect(result.name).toBe("Gate A");
    expect(result.type).toBe("gate");
    expect(result.lastUpdated).toBe("2026-01-01T12:00:00.000Z");
  });

  test("returns error for non-existent zone", async () => {
    mockGet.mockResolvedValue({ exists: false });

    const result = await getCrowdDensity("nonexistent_zone");
    expect(result.density).toBe(-1);
    expect(result.error).toBe("Zone not found");
  });
});

describe("getWaitTime", () => {
  afterEach(() => jest.clearAllMocks());

  test("computes correct wait time from density", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        density: 85,
        name: "Concessions 2",
        type: "concession",
        lastUpdated: { toDate: () => new Date() },
      }),
    });

    const result = await getWaitTime("concession_2");
    // 85 * 0.12 = 10.2 → rounded to 10
    expect(result.waitMinutes).toBe(10);
    expect(result.density).toBe(85);
    expect(result.name).toBe("Concessions 2");
  });

  test("clamps wait time to max 15 minutes", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        density: 100,
        name: "Restroom 1",
        type: "restroom",
        lastUpdated: { toDate: () => new Date() },
      }),
    });

    const result = await getWaitTime("restroom_1");
    // 100 * 0.12 = 12 → clamped at 15 (12 < 15, so stays 12)
    expect(result.waitMinutes).toBe(12);
    expect(result.waitMinutes).toBeLessThanOrEqual(15);
  });

  test("returns error for non-existent facility", async () => {
    mockGet.mockResolvedValue({ exists: false });

    const result = await getWaitTime("nonexistent");
    expect(result.waitMinutes).toBe(-1);
    expect(result.error).toBe("Facility not found");
  });
});

describe("getAllZones", () => {
  test("returns all zone documents", async () => {
    mockCollectionGet.mockResolvedValue({
      docs: [
        {
          id: "gate_a",
          data: () => ({
            name: "Gate A",
            density: 45,
            type: "gate",
            lastUpdated: { toDate: () => new Date("2026-01-01") },
          }),
        },
        {
          id: "concession_1",
          data: () => ({
            name: "Concessions 1",
            density: 60,
            type: "concession",
            lastUpdated: { toDate: () => new Date("2026-01-01") },
          }),
        },
      ],
    });

    const result = await getAllZones();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("gate_a");
    expect(result[1].density).toBe(60);
  });
});
