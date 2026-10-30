import { z } from "zod";
import { model } from "../config/model.js";

const ReviewSchema = z.object({
  approved: z.boolean(),
  overallAssessment: z.string(),
  issues: z.array(z.string()),
  requiredImprovements: z.array(z.string()),
  feedback: z.string()
});

export async function reviewerAgent(problem, plan, analysis, solution) {
  if (!problem?.trim()) {
    throw new Error("Reviewer requires the original problem.");
  }

  if (!plan?.tasks?.length) {
    throw new Error("Reviewer requires the Planner output.");
  }

  if (!analysis?.hypotheses?.length) {
    throw new Error("Reviewer requires the Analyst output.");
  }

  if (!solution?.implementationSteps?.length) {
    throw new Error("Reviewer requires the Solution output.");
  }

  const prompt = `
/no_think

You are a senior software engineer reviewing another agent's solution.

Evaluate the proposed solution against the original engineering problem,
the Planner's tasks, and the Analyst's findings.

ORIGINAL PROBLEM:
${problem}

PLANNER OUTPUT:
${JSON.stringify(plan)}

ANALYST OUTPUT:
${JSON.stringify(analysis)}

PROPOSED SOLUTION:
${JSON.stringify(solution)}

Review criteria:
1. Technical correctness.
2. Whether the solution addresses the identified hypotheses.
3. Whether implementation steps are actionable.
4. Whether the code example is appropriate and reasonably safe.
5. Whether performance improvements can be measured.
6. Whether important trade-offs or risks are overlooked.

Important rules:
- Treat suspected causes as hypotheses, not established facts.
- Do not approve a solution merely because it is well formatted.
- Identify specific, actionable issues.
- Set approved to true only when the solution is sufficiently sound.
- If improvements are required, set approved to false.
- If approved is true, issues and requiredImprovements should be empty arrays.
- Do not claim that code was executed or performance was measured.
- Return valid JSON only, without Markdown fences.
- Keep the response concise.

Return this structure:
{
  "approved": false,
  "overallAssessment": "Summary of the review",
  "issues": ["Specific issue"],
  "requiredImprovements": ["Actionable improvement"],
  "feedback": "Feedback for the Solution Agent"
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
    throw new Error("Reviewer returned invalid JSON.");
  }

  let parsedOutput;

  try {
    parsedOutput = JSON.parse(content.slice(start, end + 1));
  } catch {
    throw new Error("Reviewer could not parse the model's JSON response.");
  }

  return ReviewSchema.parse(parsedOutput);
}
