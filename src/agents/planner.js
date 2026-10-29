import { z } from "zod";
import { model } from "../config/model.js";

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"])
});

const PlanSchema = z.object({
  problemSummary: z.string(),
  tasks: z.array(TaskSchema).min(1),
  assumptions: z.array(z.string()),
  expectedOutcome: z.string()
});

export async function plannerAgent(problem) {
  if (typeof problem !== "string" || !problem.trim()) {
    throw new Error("Please provide a valid engineering problem.");
  }

  const prompt = `
/no_think

Return one complete JSON object.
Do not use Markdown code fences.
Do not include explanations outside the JSON object.
Keep the response concise.
Limit the plan to 4 tasks and 3 assumptions.
Ensure all strings are properly escaped.
Close every JSON object and array before finishing.

You are the Planner Agent in AgentFlow AI,
a multi-agent software engineering assistant.

Your responsibility is to break a developer's problem
into smaller, actionable engineering tasks.

Follow these rules:
1. Understand the original problem.
2. Identify the work required to address it.
3. Arrange tasks in a logical order.
4. Assign each task a priority: high, medium, or low.
5. Identify important assumptions and missing information.
6. Define the expected outcome.

Do not invent facts about the application.
Record missing information as assumptions or uncertainties.
Do not implement the solution. Other agents will do that.

Return a JSON object matching this structure:
{
  "problemSummary": "string",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "high"
    }
  ],
  "assumptions": ["string"],
  "expectedOutcome": "string"
}

The priority field must be high, medium, or low.
Return JSON only.

Engineering problem:
${problem}
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
    throw new Error("The model returned an unexpected response format.");
  }

  // Remove Markdown code fences if the model adds them.
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

  const jsonOutput = cleanedOutput.slice(start, end + 1);

  let parsedOutput;

  try {
    parsedOutput = JSON.parse(jsonOutput);
  } catch {
    throw new Error(
      `The model did not return valid JSON. Raw response:\n${rawOutput}`
    );
  }

  // Validate the generated plan against our application schema.
  return PlanSchema.parse(parsedOutput);
}
