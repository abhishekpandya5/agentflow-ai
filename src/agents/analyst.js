import { z } from "zod";
import { model } from "../config/model.js";

const HypothesisSchema = z.object({
  cause: z.string(),
  reasoning: z.string(),
  diagnosticStep: z.string(),
  priority: z.enum(["high", "medium", "low"])
});

const AnalysisSchema = z.object({
  summary: z.string(),
  hypotheses: z.array(HypothesisSchema).min(1),
  recommendations: z.array(z.string()).min(1),
  missingInformation: z.array(z.string())
});

export async function analystAgent(problem, plan) {
  if (typeof problem !== "string" || !problem.trim()) {
    throw new Error("Please provide a valid engineering problem.");
  }

  if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new Error("A valid Planner Agent output is required.");
  }

  const prompt = `
/no_think

You are the Analyst Agent in AgentFlow AI.

Analyze the engineering problem using the plan
created by the Planner Agent.

Rules:
1. Identify plausible technical causes.
2. Treat causes as hypotheses, not confirmed facts.
3. Explain why each cause is plausible.
4. Provide a practical diagnostic step for each cause.
5. Prioritize the hypotheses.
6. Do not invent facts about the application.
7. Identify important missing information.
8. Keep the response concise.
9. Return one complete JSON object only.
10. Do not use Markdown fences or text outside the JSON.

Required JSON structure:
{
  "summary": "string",
  "hypotheses": [
    {
      "cause": "string",
      "reasoning": "string",
      "diagnosticStep": "string",
      "priority": "high"
    }
  ],
  "recommendations": ["string"],
  "missingInformation": ["string"]
}

Use only high, medium, or low for priority.
Limit the response to 4 hypotheses and 4 recommendations.

Engineering problem:
${problem}

Planner Agent's plan:
${JSON.stringify(plan, null, 2)}
`;

  const response = await model.invoke(prompt);

  let rawOutput = response.content;

  if (Array.isArray(rawOutput)) {
    rawOutput = rawOutput
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");
  }

  if (typeof rawOutput !== "string") {
    throw new Error("The Analyst Agent returned an unexpected response.");
  }

  const cleanedOutput = rawOutput
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = cleanedOutput.indexOf("{");
  const end = cleanedOutput.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `No complete JSON object found. Raw response:\n${rawOutput}`
    );
  }

  let parsedOutput;

  try {
    parsedOutput = JSON.parse(cleanedOutput.slice(start, end + 1));
  } catch {
    throw new Error(
      `The Analyst Agent returned invalid JSON. Raw response:\n${rawOutput}`
    );
  }

  return AnalysisSchema.parse(parsedOutput);
}
