function calculateWorkingHeight(marks, isCompact) {
  const base = isCompact ? 460 : 520;
  const perMark = isCompact ? 45 : 55;
  const computed = base + Math.max(1, marks) * perMark;
  return Math.min(2200, Math.max(base, computed));
}

console.log("=== QUESTION WORKING HEIGHT SCALING TESTS ===");
const testMarks = [2, 5, 8, 12, 16, 20];
for (const m of testMarks) {
  const h = calculateWorkingHeight(m, false);
  console.log(`Marks: ${m} => Working Area Height: ${h}px`);
}

// Verify monotonicity
for (let i = 1; i < testMarks.length; i++) {
  const prevH = calculateWorkingHeight(testMarks[i - 1], false);
  const curH = calculateWorkingHeight(testMarks[i], false);
  if (curH <= prevH) {
    console.error(`❌ FAIL: Height not strictly increasing: ${testMarks[i]} marks had ${curH} <= ${prevH}`);
    process.exit(1);
  }
}
console.log("✅ PASS: Working area height strictly scales with question mark count!");

// Test Markdown Table parsing
console.log("\n=== MARKDOWN TABLE TEST ===");
const sampleTable = `
| x | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| P(X=x) | p | p | p | 1/2 p |
`;

const tableRegex = /(?:(?:^|\n)\|[^\n]+\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g;
const hasMatch = tableRegex.test(sampleTable);
console.log("Regex matches table:", hasMatch);
if (hasMatch) {
  console.log("✅ PASS: Markdown table regex matches IB exam probability distribution tables!");
} else {
  console.log("❌ FAIL: Table regex did not match!");
}
