import { z } from "zod";
import { model } from "../config/model.js";

const ReviewSchema = z.object({
  // approved: z.boolean(),
  decision: z.enum(["approved", "revise", "needs_input"]),
  overallAssessment: z.string(),
  issues: z.array(z.string()),
  requiredImprovements: z.array(z.string()),
  feedback: z.string()
});

export async function reviewerAgent(
  problem,
  plan,
  analysis,
  solution,
  validation
) {
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

VALIDATOR OUTPUT:
${JSON.stringify(validation)}

Important:
- Treat Validator issues as technical evidence requiring investigation.
- Do not approve a solution while critical validation issues remain unresolved.
- Distinguish warnings from confirmed issues.
- Do not assume that passing deterministic checks proves the code is correct.

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
- Use the decision field according to the decision rules below.
- For approved, issues and requiredImprovements should be empty arrays.
- For revise, provide specific issues and actionable improvements.
- For needs_input, explain what essential information is missing.
- Do not claim that code was executed or performance was measured.
- Return valid JSON only, without Markdown fences.
- Keep the response concise.


DECISION RULES:

1. approved:
   - The solution is technically sound and addresses the problem.
   - Required implementation and validation steps are sufficiently concrete.
   - No critical issues remain.

2. revise:
   - The solution has enough information to be improved.
   - Missing details can reasonably be supplied using technical knowledge.
   - The solution contains incomplete, incorrect, or vague implementation steps.

3. needs_input:
   - Essential information is unavailable and cannot reasonably be assumed.
   - Actual measurements, source code, configuration, logs, or database details are required.
   - The solution cannot be made reliable without information from the user.

IMPORTANT:
- Do not request actual measurements as a reason to revise when those measurements have not been provided.
- You may recommend how the user can collect missing measurements.
- Do not invent database metrics, query details, or performance results.
- A solution can be useful even when the root cause has not yet been confirmed.
- Passing Validator checks does not automatically mean a solution should be approved.

When decision is "approved", issues and requiredImprovements must be empty arrays.

When decision is "revise", provide actionable improvements.

When decision is "needs_input", explain exactly what information is needed from the user.

Do not reject a solution merely because additional
information could make it more precise.

Return this structure:
{
  "decision": "approved" | "revise" | "needs_input",
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
