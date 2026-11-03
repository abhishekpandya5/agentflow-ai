import { validatorAgent } from "./agents/validator.js";

const testSolution = {
  approach: "Use virtualization to render large product lists.",
  implementationSteps: ["Implement virtualization for the product list."],
  codeExample: `
    const ProductList = ({ products }) => {
      return (
        <div>
          {Array(100).fill(() => (
            <div key={Math.random()}>
              Product
            </div>
          ))}
        </div>
      );
    };
  `
};

const result = validatorAgent(testSolution);

console.log("\n=== VALIDATION RESULT ===");
console.log(JSON.stringify(result, null, 2));
