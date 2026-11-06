export function validatorAgent(problem, solution) {
  if (typeof problem !== "string" || !problem.trim()) {
    throw new Error("Validator requires a valid problem description.");
  }

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

  // Check: Detect incorrect react-virtualized API usage
  if (/useVirtualized/.test(code) && /react-virtualized/.test(code)) {
    issues.push(
      "Invalid react-virtualized API: useVirtualized is not an exported API. Use supported components such as List or Grid."
    );
  } else if (
    /react-virtualized/.test(code) &&
    /\b(List|Grid|AutoSizer)\b/.test(code)
  ) {
    checks.push("Recognized react-virtualized API detected.");
  }

  const domain = classifyProblem(problem);

  if (domain === "frontend") {
    const hasFrontendCode =
      /react|jsx|tsx|useState|useMemo|useCallback|document\.|window\./i.test(
        code
      );

    const hasBackendCode =
      /mongoose|mongodb|express\(\)|router\.get|collection\(/i.test(code);

    if (hasBackendCode && !hasFrontendCode) {
      issues.push(
        "The problem is frontend-related, but the generated code contains only backend implementation."
      );
    } else if (hasFrontendCode) {
      checks.push("Frontend-related code detected.");
    } else {
      warnings.push(
        "Could not confidently identify frontend implementation in the code example."
      );
    }
  }

  if (domain === "backend") {
    const hasBackendCode =
      /mongoose|mongodb|express|router\.|collection\(|findById|findOne|find\(/i.test(
        code
      );

    const hasFrontendCode = /jsx|useState|useEffect|useMemo|useCallback/i.test(
      code
    );

    if (hasFrontendCode && !hasBackendCode) {
      issues.push(
        "The problem is backend-related, but the generated code contains only frontend implementation."
      );
    } else if (hasBackendCode) {
      checks.push("Backend-related code detected.");
    } else {
      warnings.push(
        "Could not confidently identify backend implementation in the code example."
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    checks
  };
}

function classifyProblem(problem) {
  const text = problem.toLowerCase();

  if (/react|frontend|component|rendering|dom/.test(text)) {
    return "frontend";
  }

  if (/mongodb|database|sql|redis|node\.js|express|backend|api/.test(text)) {
    return "backend";
  }

  return "general";
}
