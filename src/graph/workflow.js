import { StateGraph, START, END } from "@langchain/langgraph";

import { AgentFlowState } from "./state.js";
import { plannerAgent } from "../agents/planner.js";
import { analystAgent } from "../agents/analyst.js";
import { solutionAgent } from "../agents/solution.js";
import { reviewerAgent } from "../agents/reviewer.js";
import { validatorAgent } from "../agents/validator.js";

import { MemorySaver } from "@langchain/langgraph";

async function plannerNode(state) {
  console.log("\n[Graph] Running Planner Node...");

  const plan = await plannerAgent(state.problem);

  return { plan };
}

async function analystNode(state) {
  console.log("\n[Graph] Running Analyst Node...");

  const analysis = await analystAgent(state.problem, state.plan);

  return { analysis };
}

async function solutionNode(state) {
  console.log(
    `\n[Graph] Running Solution Node (attempt ${(state.revisionCount ?? 0) + 1})...`
  );

  const solution = await solutionAgent(
    state.problem,
    state.plan,
    state.analysis,
    state.solution ?? null,
    state.revisionFeedback ?? ""
  );

  return {
    solution,
    revisionCount: (state.revisionCount ?? 0) + 1
  };
}

async function validatorNode(state) {
  console.log("\n[Graph] Running Validator Node...");

  const validation = validatorAgent(state.problem, state.solution);

  console.log(`[Graph] Validation: ${validation.valid ? "PASSED" : "FAILED"}`);

  console.log(`[Graph] Issues detected: ${validation.issues.length}`);

  return { validation };
}

async function reviewerNode(state) {
  console.log("\n[Graph] Running Reviewer Node...");

  const review = await reviewerAgent(
    state.problem,
    state.plan,
    state.analysis,
    state.solution,
    state.validation
  );

  // console.log(
  //   `\n[Graph] Review decision: ${review.approved ? "APPROVED" : "REJECTED"}`
  // );

  console.log(`\n[Graph] Review decision: ${review.decision.toUpperCase()}`);

  return {
    review,
    revisionFeedback: review.feedback
  };
}

// function routeAfterReview(state) {
//   const MAX_ATTEMPTS = 3;

//   if (state.review.approved) {
//     return "finish";
//   }

//   if (state.revisionCount >= MAX_ATTEMPTS) {
//     console.log("\n[Graph] Maximum solution attempts reached.");

//     return "finish";
//   }

//   return "revise";
// }

function routeAfterReview(state) {
  const MAX_ATTEMPTS = 3;

  if (state.review.decision === "approved") {
    return "finish";
  }

  if (state.review.decision === "needs_input") {
    console.log(
      "\n[Graph] Additional information is required. Stopping revision."
    );
    return "finish";
  }

  if (state.revisionCount >= MAX_ATTEMPTS) {
    console.log("\n[Graph] Maximum solution attempts reached.");
    return "finish";
  }

  return "revise";
}

const checkpointer = new MemorySaver();

export const agentFlow = new StateGraph(AgentFlowState)
  .addNode("planner", plannerNode)
  .addNode("analyst", analystNode)
  .addNode("solution_node", solutionNode)
  .addNode("validator_node", validatorNode)
  .addNode("reviewer_node", reviewerNode)
  .addEdge(START, "planner")
  .addEdge("planner", "analyst")
  .addEdge("analyst", "solution_node")
  .addEdge("solution_node", "validator_node")
  .addEdge("validator_node", "reviewer_node")
  // .addEdge("reviewer_node", END)
  .addConditionalEdges("reviewer_node", routeAfterReview, {
    revise: "solution_node",
    finish: END
  })
  .compile({
    checkpointer
  });
