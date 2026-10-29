import { ChatOllama } from "@langchain/ollama";

export const model = new ChatOllama({
  model: "qwen3:1.7b",
  temperature: 0.2,
  numPredict: 700,
  think: false,
});
