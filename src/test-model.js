import { model } from "./config/model.js";

async function main() {
  try {
    const response = await model.invoke(
      "Explain what React memoization is in three short bullet points."
    );

    console.log("\n=== LOCAL LLM RESPONSE ===\n");
    console.log(response.content);
  } catch (error) {
    console.error("Model test failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();

// function fetchWithTimeout() {
//   const controller = new AbortController();

//   const timerController = setTimeout(() => {
//     controller.abort();
//   }, 5000);

//   fetch("https://jsonplaceholder.typicode.com/posts/1", {
//     signal: controller.signal
//   })
//     .then((response) => response.json())
//     .then((json) => console.log(json))
//     .catch((err) => {
//       console.error(err);
//       clearTimeout(timerController);
//     });
// }

// fetchWithTimeout();
