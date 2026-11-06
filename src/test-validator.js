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

// const problem =
//   "My React application becomes slow when rendering 1,000 products.";

// const result = validatorAgent(problem, testSolution);

// console.log("\n=== VALIDATION RESULT ===");
// console.log(JSON.stringify(result, null, 2));

const invalidVirtualizationSolution = {
  approach: "Use React virtualization.",
  implementationSteps: ["Render only visible products."],
  codeExample: `
    import { useVirtualized } from 'react-virtualized';

    function ProductList() {
      return <div>Products</div>;
    }
  `,
  validationSteps: ["Measure rendering performance."],
  risks: []
};

const result = validatorAgent(
  "My React application is slow when rendering 1,000 products.",
  invalidVirtualizationSolution
);

console.log("\n=== INVALID API TEST ===");
console.log(JSON.stringify(result, null, 2));
