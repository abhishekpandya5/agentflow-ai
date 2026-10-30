import { StateGraph, START, END } from "@langchain/langgraph";

import { AgentFlowState } from "./state.js";
import { plannerAgent } from "../agents/planner.js";
import { analystAgent } from "../agents/analyst.js";
import { solutionAgent } from "../agents/solution.js";
import { reviewerAgent } from "../agents/reviewer.js";

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
  console.log("\n[Graph] Running Solution Node...");

  const solution = await solutionAgent(
    state.problem,
    state.plan,
    state.analysis
  );

  return { solution };
}

async function reviewerNode(state) {
  console.log("\n[Graph] Running Reviewer Node...");

  const review = await reviewerAgent(
    state.problem,
    state.plan,
    state.analysis,
    state.solution
  );

  return { review };
}

export const agentFlow = new StateGraph(AgentFlowState)
  .addNode("planner", plannerNode)
  .addNode("analyst", analystNode)
  .addNode("solution_node", solutionNode)
  .addNode("reviewer_node", reviewerNode)
  .addEdge(START, "planner")
  .addEdge("planner", "analyst")
  .addEdge("analyst", "solution_node")
  .addEdge("solution_node", "reviewer_node")
  .addEdge("reviewer_node", END)
  .compile();
