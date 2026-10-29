import { z } from "zod";
import { model } from "../config/model.js";

const SolutionSchema = z.object({
  approach: z.string(),
  implementationSteps: z.array(z.string()).min(1),
  codeExample: z.string(),
  validationSteps: z.array(z.string()).min(1),
  risks: z.array(z.string())
});

export async function solutionAgent(problem, plan, analysis) {
  if (typeof problem !== "string" || !problem.trim()) {
    throw new Error("Solution Agent requires a valid problem.");
  }

  if (!plan?.tasks?.length) {
    throw new Error("Solution Agent requires the Planner output.");
  }

  if (!analysis?.hypotheses?.length) {
    throw new Error("Solution Agent requires the Analyst output.");
  }

  const prompt = `
/no_think

You are a senior software engineer.

Develop a practical solution using the engineering problem,
the Planner's tasks, and the Analyst's hypotheses.

ENGINEERING PROBLEM:
${problem}

PLANNER OUTPUT:
${JSON.stringify(plan)}

ANALYST OUTPUT:
${JSON.stringify(analysis)}

Requirements:
- Distinguish confirmed facts from hypotheses.
- Do not claim that unverified causes are confirmed.
- Give actionable implementation steps.
- Include a concise React JavaScript code example.
- Consider list virtualization where appropriate.
- Explain how to validate performance improvements.
- Return valid JSON only, without Markdown fences.
- Keep the response concise enough to fit the output limit.

Return this JSON structure:
{
  "approach": "Overall solution strategy",
  "implementationSteps": ["Step 1", "Step 2"],
  "codeExample": "React JavaScript code as a string",
  "validationSteps": ["Validation step 1"],
  "risks": ["Potential risk"]
}
`;

  const response = await model.invoke(prompt);

  const content =
    typeof response.content === "string"
      ? response.content
      : response.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Solution Agent returned invalid JSON.");
  }

  let parsedOutput;

  try {
    parsedOutput = JSON.parse(content.slice(start, end + 1));
  } catch {
    throw new Error(
      "Solution Agent could not parse the model's JSON response."
    );
  }

  return SolutionSchema.parse(parsedOutput);
}
