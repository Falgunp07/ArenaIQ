/**
 * gemini.test.js — Unit tests for Gemini function calling routing
 *
 * Tests that the function calling flow correctly routes
 * get_crowd_density and get_wait_time calls to the right handlers
 * and returns appropriate responses.
 */

// ── Mock @google/genai ──
const mockGenerateContent = jest.fn();

jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// ── Mock crowd.js ──
jest.mock("../crowd", () => ({
  getCrowdDensity: jest.fn(),
  getWaitTime: jest.fn(),
}));

const { getCrowdDensity, getWaitTime } = require("../crowd");

// Set env before requiring gemini
process.env.GEMINI_API_KEY = "test-key";
const { handleChat, functionHandlers } = require("../gemini");

describe("Function Handlers", () => {
  test("functionHandlers has get_crowd_density", () => {
    expect(functionHandlers).toHaveProperty("get_crowd_density");
    expect(typeof functionHandlers.get_crowd_density).toBe("function");
  });

  test("functionHandlers has get_wait_time", () => {
    expect(functionHandlers).toHaveProperty("get_wait_time");
    expect(typeof functionHandlers.get_wait_time).toBe("function");
  });

  test("get_crowd_density handler calls getCrowdDensity with zone_id", async () => {
    getCrowdDensity.mockResolvedValue({ density: 65, name: "Gate B" });
    const result = await functionHandlers.get_crowd_density({ zone_id: "gate_b" });
    expect(getCrowdDensity).toHaveBeenCalledWith("gate_b");
    expect(result.density).toBe(65);
  });

  test("get_wait_time handler calls getWaitTime with facility_id", async () => {
    getWaitTime.mockResolvedValue({ waitMinutes: 8, name: "Concessions 1" });
    const result = await functionHandlers.get_wait_time({ facility_id: "concession_1" });
    expect(getWaitTime).toHaveBeenCalledWith("concession_1");
    expect(result.waitMinutes).toBe(8);
  });
});

describe("handleChat", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns text response when no function call", async () => {
    mockGenerateContent.mockResolvedValue({
      functionCalls: null,
      text: "Welcome to the stadium!",
    });

    const result = await handleChat("Hello");
    expect(result.reply).toBe("Welcome to the stadium!");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  test("routes function call and returns final response", async () => {
    // First call: Gemini requests a function call
    mockGenerateContent.mockResolvedValueOnce({
      functionCalls: [
        {
          name: "get_crowd_density",
          args: { zone_id: "gate_a" },
        },
      ],
      text: null,
    });

    // Mock the crowd function
    getCrowdDensity.mockResolvedValue({
      density: 42,
      name: "Gate A",
      type: "gate",
      lastUpdated: "2026-01-01T12:00:00Z",
    });

    // Second call: Gemini generates final response with function result
    mockGenerateContent.mockResolvedValueOnce({
      functionCalls: null,
      text: "Gate A currently has 42% capacity. It's pretty quiet right now!",
    });

    const result = await handleChat("How crowded is Gate A?");

    // Verify function was called
    expect(getCrowdDensity).toHaveBeenCalledWith("gate_a");

    // Verify two calls to Gemini (initial + with function result)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    // Verify final response
    expect(result.reply).toContain("42%");
  });

  test("handles get_wait_time function call", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      functionCalls: [
        {
          name: "get_wait_time",
          args: { facility_id: "restroom_1" },
        },
      ],
      text: null,
    });

    getWaitTime.mockResolvedValue({
      waitMinutes: 5,
      density: 45,
      name: "Restroom 1",
      type: "restroom",
    });

    mockGenerateContent.mockResolvedValueOnce({
      functionCalls: null,
      text: "Restroom 1 has about a 5-minute wait.",
    });

    const result = await handleChat("How long is the restroom wait?");
    expect(getWaitTime).toHaveBeenCalledWith("restroom_1");
    expect(result.reply).toContain("5-minute");
  });
});
