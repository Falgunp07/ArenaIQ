/**
 * gemini.js — Gemini 2.0 Flash + Function Calling
 *
 * Integrates with the @google/genai SDK to provide an AI chat assistant
 * that can query live crowd data via declared tool functions before
 * generating natural-language responses.
 */

const { GoogleGenAI } = require("@google/genai");
const { getCrowdDensity, getWaitTime } = require("./crowd");

// ── Initialise SDK ──
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
if (!geminiApiKey) {
  throw new Error("Missing API key. Set GEMINI_API_KEY in environment variables.");
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// ── System Prompt (venue context) ──
const SYSTEM_PROMPT = `You are ArenaIQ, a friendly and helpful smart stadium assistant for a 60,000-seat multi-purpose arena. You help attendees navigate the venue, find less-crowded areas, and get real-time information.

VENUE LAYOUT:
- 4 Entry Gates:
  • Gate A (North) — main entrance, closest to parking lot
  • Gate B (East) — nearest to public transit station
  • Gate C (South) — VIP and accessible entrance
  • Gate D (West) — closest to concessions area
  
- 4 Concession Stands:
  • Concessions 1 (near Gate A) — burgers, hot dogs, fries
  • Concessions 2 (near Gate B) — pizza, nachos, loaded fries
  • Concessions 3 (near Gate C) — vegetarian wraps, salads, falafel, hummus plates
  • Concessions 4 (near Gate D) — drinks, ice cream, frozen yogurt, smoothies

- 2 Restroom Blocks:
  • Restroom 1 (between Gate A & Gate B) — 20 stalls
  • Restroom 2 (between Gate C & Gate D) — 15 stalls

- Main Stand — general seating area (Sections A through F)
- Exit Corridor — main exit route after events

SECTION ROUTING:
- Sections A–B: enter via Gate A or Gate B
- Sections C–D: enter via Gate B or Gate C
- Sections E–F: enter via Gate C or Gate D

BEHAVIOR GUIDELINES:
1. Always check real-time crowd density before giving gate/facility recommendations.
2. When asked about wait times, use the get_wait_time function to provide accurate data.
3. If multiple zones are relevant, compare them and recommend the best option.
4. Be concise but friendly. Use emojis sparingly for warmth (1-2 per message max).
5. If a zone is above 80% capacity, proactively warn the user and suggest alternatives.
6. For directions, reference gate proximity and section layout from the venue info above.
7. Always mention specific numbers (density %, wait minutes) when available.`;

// ── Tool Declarations ──
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_crowd_density",
        description:
          "Get the current crowd density percentage (0-100) for a specific zone in the stadium. Use this to check how crowded a gate, concession stand, restroom, or other area is.",
        parameters: {
          type: "object",
          properties: {
            zone_id: {
              type: "string",
              description:
                'The zone identifier, e.g. "gate_a", "gate_b", "concession_1", "concession_3", "restroom_1", "restroom_2", "main_stand", "exit_corridor"',
            },
          },
          required: ["zone_id"],
        },
      },
      {
        name: "get_wait_time",
        description:
          "Get the estimated wait time in minutes for a facility (concession stand or restroom). Use this when users ask how long they'll have to wait.",
        parameters: {
          type: "object",
          properties: {
            facility_id: {
              type: "string",
              description:
                'The facility identifier, e.g. "concession_1", "concession_2", "restroom_1", "restroom_2"',
            },
          },
          required: ["facility_id"],
        },
      },
    ],
  },
];

// ── Function execution map ──
const functionHandlers = {
  get_crowd_density: async (args) => getCrowdDensity(args.zone_id),
  get_wait_time: async (args) => getWaitTime(args.facility_id),
};

function getFunctionCallParts(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.filter((part) => part && part.functionCall);
}

/**
 * Handle a chat message with Gemini function calling.
 * Supports multi-turn function calls (Gemini may call multiple functions).
 *
 * @param {string} userMessage — the user's chat message
 * @param {Array} history — previous conversation turns (optional)
 * @returns {{ reply: string }}
 */
async function handleChat(userMessage, history = []) {
  // Build conversation contents
  const contents = [
    ...history,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  // First call to Gemini
  let response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      tools,
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  // Function calling loop (max 5 iterations to prevent infinite loops)
  let iterations = 0;
  while (iterations < 5) {
    const functionCallParts = getFunctionCallParts(response);
    const calls = functionCallParts.map((part) => part.functionCall).filter(Boolean);
    if (!calls.length) {
      break;
    }

    iterations++;

    const functionResponses = [];

    // Execute all function calls in parallel
    for (const call of calls) {
      const handler = functionHandlers[call.name];
      if (!handler) {
        console.error(`[gemini] Unknown function: ${call.name}`);
        functionResponses.push({
          name: call.name,
          id: call.id,
          response: { error: `Unknown function: ${call.name}` },
        });
        continue;
      }

      console.log(`[gemini] Calling ${call.name}(${JSON.stringify(call.args)})`);
      const result = await handler(call.args || {});
      functionResponses.push({
        name: call.name,
        id: call.id,
        response: result,
      });
    }

    // Build the follow-up content with original function-call parts and responses
    // to preserve thoughtSignature metadata required by Gemini tools API.
    const functionResponseParts = functionResponses.map((fr) => ({
      functionResponse: fr,
    }));

    contents.push({ role: "model", parts: functionCallParts });
    contents.push({ role: "user", parts: functionResponseParts });

    // Send function results back to Gemini
    response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        tools,
        systemInstruction: SYSTEM_PROMPT,
      },
    });
  }

  const reply = response.text || "I'm sorry, I couldn't process that request. Please try again.";
  return { reply };
}

/**
 * Generate a staff summary of current bottlenecks.
 * @param {Array} zones — all zone data
 * @returns {{ summary: string }}
 */
async function generateStaffSummary(zones) {
  const zoneReport = zones
    .map((z) => `${z.name}: ${z.density}% density`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an operations analyst for a stadium. Given the current zone densities below, provide a brief summary (2-3 sentences) identifying current bottlenecks (zones above 70%) and recommending specific actions (e.g., opening overflow gates, redirecting foot traffic). Be direct and actionable.\n\nCURRENT ZONE DATA:\n${zoneReport}`,
          },
        ],
      },
    ],
  });

  return { summary: response.text || "Unable to generate summary at this time." };
}

module.exports = { handleChat, generateStaffSummary, tools, functionHandlers, SYSTEM_PROMPT };
