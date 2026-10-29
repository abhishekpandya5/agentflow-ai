import { plannerAgent } from "./agents/planner.js";
import { analystAgent } from "./agents/analyst.js";

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

    console.log("\n=== 1. Planner Agent ===");
    const plan = await plannerAgent(problem);

    console.log(JSON.stringify(plan, null, 2));

    console.log("\n=== 2. Analyst Agent ===");
    const analysis = await analystAgent(problem, plan);

    console.log(JSON.stringify(analysis, null, 2));

    console.log("\nBoth agents completed successfully.");
  } catch (error) {
    console.error("\nAgentFlow AI failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
