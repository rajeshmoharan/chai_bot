import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";
import { log } from "node:console";
import NodeCache from "node-cache";

/**
 * these two are api key take key from the env file
 */
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });

export async function chatBotGenerate(userQuestion, threadId) {
  const baseMessage = [
    {
      role: "system",
      content: `You are the Jarvi , a personal assitance
            you have access to tool calling and get the real time data
            webSearch(query) tool use for the latest data get from the we
            
            Example:
            1. What is the weather of Delhi ?
            (use the tool and get the real time data from internet and serve)
            
            2.Who is the President of India ?
            (use the tool and get the real time data from internet and serve)

            3.Who is the President of Usa ?
            (use the tool and get the real time data from internet and serve)

            4. Latest Film release in this month  ?
            (use the tool and get the real time data from internet and serve)

            current date and time : ${new Date().toUTCString()}
          `,
    },
  ];

  const message = cache.get(threadId) ?? baseMessage;

  message.push({
    role: "user",
    content: userQuestion,
  });

  const MAX_RETRY = 10;
  const count = 0;

  while (true) {

    if (count > MAX_RETRY) {
      return "I could not find soluction, Please try again";
    }

    count++;

    const completions = await groq.chat.completions.create({
      temperature: 0,
      // top_p : ,
      // stop : '',
      // max_completion_tokens : 2000,
      // frequency_penalty : 1,
      // presence_penalty : 1,
      // response_format: {'type' : 'json_object'},
      model: "llama-3.3-70b-versatile",
      messages: message,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description: "Search online for latest information",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    message.push(completions?.choices[0]?.message);

    const toolCalls = completions.choices[0].message.tool_calls;

    if (!toolCalls) {
      cache.set(threadId, message);
      return completions?.choices[0]?.message?.content;
    }

    /**
     * tool calling to get the data
     */
    for (const tool of toolCalls) {
      const toolName = tool?.function?.name;
      const toolArgument = tool?.function?.arguments;

      if (toolName == "webSearch") {
        const result = await webSearch(JSON.parse(toolArgument));
        message.push({
          tool_call_id: tool.id,
          role: "tool",
          name: toolName,
          content: result,
        });
      }
    }
  }
}

async function webSearch({ query }) {
  const response = await tvly.search(query);
  return response?.results?.map((result) => result?.content).join("\n\n");
}
