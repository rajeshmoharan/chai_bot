import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";
import { log } from "node:console";

/**
 * these two are api key take key from the env file
 */
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const message = [
    {
      role: "system",
      content: `You are the smart personnal assitance who answer the asked questions .
            Have the the access of the tool calling
            1 - webSearch({query} : {query:string}) // this is the query that need to search from the online
            current date and time : ${new Date().toUTCString()}
          `,
    },
  ];

  while (true) {
    const question = await rl.question("You:");

    message.push({
      role: "user",
      content: question,
    });

    if (question == "bye") {
      break;
    }

    while (true) {
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
        console.log(completions?.choices[0]?.message?.content);
        break;
      }

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
  rl.close();
}

async function webSearch({ query }) {
  const response = await tvly.search(query);
  return response?.results?.map((result) => result?.content).join("\n\n");
}

main();
