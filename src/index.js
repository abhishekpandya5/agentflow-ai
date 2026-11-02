import { agentFlow } from "./graph/workflow.js";

const problem = `
My React application becomes slow when rendering
a page containing 1,000 products.

Help me identify the possible causes and plan
an investigation and optimization strategy.
`;

async function main() {
  try {
    console.log("\n=== AgentFlow AI ===");
    console.log("\nEngineering problem:");
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
  } catch (error) {
    console.error("\nAgentFlow AI failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

main();
