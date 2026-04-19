/**
 * llm.js â€” OpenAI Integraton + Function Calling
 *
 * Integrates with the OpenAI SDK to provide an AI chat assistant
 * that can query live crowd data via declared tool functions before
 * generating natural-language responses.
 */

const Groq = require("groq-sdk");
const { getCrowdDensity, getWaitTime } = require("./crowd");

// ==========================================
// Initialize SDK
// ==========================================
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const DEFAULT_MODEL = "llama-3.3-70b-versatile"; // Extremely fast and capable model on Groq

// ==========================================
// System Prompt (venue context)
// ==========================================
const SYSTEM_PROMPT = `You are ArenaIQ, a friendly and helpful smart stadium assistant for a 60,000-seat multi-purpose arena. You help attendees navigate the venue, find less-crowded areas, and get real-time information.

VENUE LAYOUT:
- 4 Entry Gates:
  â€¢ Gate A (North) â€” main entrance, closest to parking lot
  â€¢ Gate B (East) â€” nearest to public transit station
  â€¢ Gate C (South) â€” VIP and accessible entrance
  â€¢ Gate D (West) â€” closest to concessions area
  
- 4 Concession Stands:
  â€¢ Concessions 1 (near Gate A) â€” burgers, hot dogs, fries
  â€¢ Concessions 2 (near Gate B) â€” pizza, nachos, loaded fries
  â€¢ Concessions 3 (near Gate C) â€” vegetarian wraps, salads, falafel, hummus plates
  â€¢ Concessions 4 (near Gate D) â€” drinks, ice cream, frozen yogurt, smoothies

- 2 Restroom Blocks:
  â€¢ Restroom 1 (between Gate A & Gate B) â€” 20 stalls
  â€¢ Restroom 2 (between Gate C & Gate D) â€” 15 stalls

- Main Stand â€” general seating area (Sections A through F)
- Exit Corridor â€” main exit route after events

SECTION ROUTING:
- Sections Aâ€“B: enter via Gate A or Gate B
- Sections Câ€“D: enter via Gate B or Gate C
- Sections Eâ€“F: enter via Gate C or Gate D

BEHAVIOR GUIDELINES:
1. Always check real-time crowd density before giving gate/facility recommendations.
2. When asked about wait times, use the get_wait_time function to provide accurate data.
3. If multiple zones are relevant, compare them and recommend the best option.
4. Be concise but friendly. Use emojis sparingly for warmth (1-2 per message max).
5. If a zone is above 80% capacity, proactively warn the user and suggest alternatives.
6. For directions, reference gate proximity and section layout from the venue info above.
7. Always mention specific numbers (density %, wait minutes) when available.`;

// ==========================================
// Tool Declarations
// ==========================================
const tools = [
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
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
  },
];

// ==========================================
// Function execution map
// ==========================================
const functionHandlers = {
  get_crowd_density: async (args) => getCrowdDensity(args.zone_id),
  get_wait_time: async (args) => getWaitTime(args.facility_id),
};

/**
 * Handle a chat message with OpenAI function calling.
 *
 * @param {string} userMessage â€” the user's chat message
 * @param {Array} history â€” previous conversation turns (optional)
 * @returns {{ reply: string }}
 */
async function handleChat(userMessage, history = []) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  let response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    tools,
    tool_choice: "auto",
  });

  let responseMessage = response.choices[0].message;
  let iterations = 0;

  // Handle auto function calls (up to 5 iterations)
  while (responseMessage.tool_calls && iterations < 5) {
    iterations++;
    messages.push(responseMessage); // Add assistant's tool calls to context

    // Execute functions sequentially or map them
    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const handler = functionHandlers[functionName];

      let functionResponse;
      if (!handler) {
        console.error(`[groq] Unknown function: ${functionName}`);
        functionResponse = JSON.stringify({ error: `Unknown function: ${functionName}` });
      } else {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`[groq] Calling ${functionName}(${JSON.stringify(args)})`);
        const result = await handler(args);
        functionResponse = JSON.stringify(result);
      }

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: functionResponse,
      });
    }

    // Call Groq again with the tool responses
    response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools,
      tool_choice: "auto",
    });

    responseMessage = response.choices[0].message;
  }

  const reply = responseMessage.content || "I'm sorry, I couldn't process that request. Please try again.";
  return { reply };
}

/**
 * Generate a staff summary of current bottlenecks.
 * @param {Array} zones â€” all zone data
 * @returns {{ summary: string }}
 */
async function generateStaffSummary(zones) {
  const zoneReport = zones
    .map((z) => `${z.name}: ${z.density}% density`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: `You are an operations analyst for a stadium. Given the current zone densities below, provide a brief summary (2-3 sentences) identifying current bottlenecks (zones above 70%) and recommending specific actions (e.g., opening overflow gates, redirecting foot traffic). Be direct and actionable.\n\nCURRENT ZONE DATA:\n${zoneReport}`,
      },
    ],
  });

  return { summary: response.choices[0].message.content || "Unable to generate summary at this time." };
}

module.exports = { handleChat, generateStaffSummary };
