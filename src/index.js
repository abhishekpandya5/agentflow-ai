import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { agentFlow } from "./graph/workflow.js";

const problem = `
My React application becomes slow when rendering
a page containing 1,000 products.

Help me identify the possible causes and plan
an investigation and optimization strategy.
`;

const rl = readline.createInterface({
  input: stdin,
  output: stdout
});

try {
  console.log("\n=== AgentFlow AI ===\n");

  // const problem = await rl.question("Describe your engineering problem:\n> ");

  // if (!problem.trim()) {
  //   throw new Error("Please enter a valid engineering problem.");
  // }

  console.log("\nEngineering problem:\n");
  console.log(problem);

  const result = await agentFlow.invoke({
    problem,
    revisionCount: 0,
    revisionFeedback: ""
  });

  console.log("\n=== PLANNER OUTPUT ===\n");
  console.log(JSON.stringify(result.plan, null, 2));

  console.log("\n=== ANALYST OUTPUT ===\n");
  console.log(JSON.stringify(result.analysis, null, 2));

  console.log("\n=== SOLUTION OUTPUT ===\n");
  console.log(JSON.stringify(result.solution, null, 2));

  console.log("\n=== REVIEW OUTPUT ===\n");
  console.log(JSON.stringify(result.review, null, 2));

  console.log("\n=== VALIDATION DEBUG ===");
  console.log(JSON.stringify(result.validation, null, 2));

  console.log("\n=== WORKFLOW STATUS ===");
  console.log("Solution attempts:", result.revisionCount);
  // console.log(
  //   "Final review:",
  //   result.review.approved ? "APPROVED" : "NOT APPROVED"
  // );

  console.log("Final review:", result.review.decision.toUpperCase());

  console.log("\nReviewer assessment:");
  console.log(result.review.overallAssessment);

  if (result.review.decision === "needs_input") {
    console.log("\nAdditional information required:");
    console.log(result.review.issues);
  } else if (result.review.decision === "revise") {
    console.log("\nThe maximum attempts were reached.");
    console.log("Remaining improvements:");
    console.log(result.review.requiredImprovements);
  }

  console.log("\nLangGraph workflow completed successfully.");

  // Keep your existing output-printing code below this point.
  // It should print planner, analyst, solution, review and workflow status.
} catch (error) {
  console.error("\nAgentFlow failed:", error.message);
} finally {
  rl.close();
}
