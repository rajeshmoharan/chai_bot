console.log("Working!!!");

const input = document.querySelector("#input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask");

const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2,8);

input.addEventListener("keyup", handleEnter);
askBtn.addEventListener("click", handleClick);

const loading = document.createElement("div");
loading.className = "my-6";
loading.textContent = "Thinking...";

async function generate(text) {
  // User Message
  const userMsg = document.createElement("div");
  userMsg.className =
    "bg-blue-600 text-white p-3 rounded-xl max-w-[75%] self-end ml-auto";
  userMsg.textContent = text;
  chatContainer.appendChild(userMsg);
  input.value = "";

  // Show loading
  chatContainer.appendChild(loading);
  scrollToBottom();

  // Bot Message
  try {
    const assistantMessage = await callServer(text);
    const botMsg = document.createElement("div");
    botMsg.className =
      "bg-neutral-700 text-white p-3 rounded-xl max-w-[75%] self-start";
    botMsg.textContent = assistantMessage;
    loading.remove();
    chatContainer.appendChild(botMsg);
    scrollToBottom();
  } catch (error) {
    loading.remove();
    const errorMsg = document.createElement("div");
    errorMsg.className =
      "bg-red-600 text-white p-3 rounded-xl max-w-[75%] self-start";
    errorMsg.textContent = "Error: Could not generate response.";
    chatContainer.appendChild(errorMsg);
  }
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}


async function callServer(inputText) {
  const response = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadId ,message: inputText }),
  });

  if (!response.ok) {
    throw new Error("Error generating data");
  }
  const result = await response.json();
  console.log("result", result);
  return result?.message;
}

async function handleClick(e) {
  const text = input?.value.trim();

  if (!text) {
    return;
  }
  await generate(text);
}

async function handleEnter(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (text)  await generate(text);
  }
}

