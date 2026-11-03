export function validatorAgent(solution) {
  if (!solution || typeof solution !== "object") {
    throw new Error("Validator requires a valid solution.");
  }

  const code = solution.codeExample ?? "";
  const issues = [];
  const warnings = [];
  const checks = [];

  // Check 1: Ensure code example exists
  if (!code.trim()) {
    issues.push("Solution does not contain a code example.");
  } else {
    checks.push("Code example is present.");
  }

  // Check 2: Detect unstable React keys
  if (/key\s*=\s*\{\s*Math\.random\s*\(/.test(code)) {
    issues.push("Unstable React key detected: Math.random() is used as a key.");
  } else {
    checks.push("No Math.random() React keys detected.");
  }

  // Check 3: Detect incorrect Array.fill() rendering pattern
  if (
    /Array\s*\([^)]*\)\s*\.fill\s*\(\s*\(?\s*(?:async\s+)?(?:function|\(?[\w\s,]*\)?\s*=>)/s.test(
      code
    )
  ) {
    issues.push(
      "Array.fill() appears to be used with a callback. fill() does not execute callbacks."
    );
  } else {
    checks.push("No suspicious Array.fill() callback pattern detected.");
  }

  // Check 4: Verify virtualization implementation
  const solutionDescription = [
    solution.approach ?? "",
    ...(solution.implementationSteps ?? [])
  ].join(" ");

  const claimsVirtualization = /virtualiz|windowing/i.test(solutionDescription);

  const virtualizationPatterns = [
    /FixedSizeList/,
    /VariableSizeList/,
    /FixedSizeGrid/,
    /VariableSizeGrid/,
    /useVirtualizer/,
    /useWindowVirtualizer/,
    /react-window/,
    /react-virtualized/,
    /@tanstack\/react-virtual/
  ];

  const containsVirtualizationImplementation = virtualizationPatterns.some(
    (pattern) => pattern.test(code)
  );

  if (claimsVirtualization && !containsVirtualizationImplementation) {
    issues.push(
      "Solution claims virtualization, but the code does not demonstrate a recognized virtualization API."
    );
  } else if (containsVirtualizationImplementation) {
    checks.push("Recognizable virtualization implementation detected.");
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    checks
  };
}
