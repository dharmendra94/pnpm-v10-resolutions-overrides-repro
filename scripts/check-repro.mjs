import { readFileSync } from "node:fs";

const lockfile = readFileSync("pnpm-lock.yaml", "utf8");

const expectedConfig = [
  "overrides:",
  "  is-number: 7.0.0",
  "  is-odd: 3.0.1"
].join("\n");

const actualBug = [
  "overrides:",
  "  is-odd: 3.0.1"
].join("\n");

const isNumberIgnored = /is-number@6\.0\.0:/.test(lockfile);
const isNumberApplied = /is-number@7\.0\.0:/.test(lockfile);

console.log("Expected lockfile override block:");
console.log(expectedConfig);
console.log();
console.log("Actual PNPM v10 lockfile override block:");
console.log(actualBug);
console.log();

if (isNumberIgnored && lockfile.includes(actualBug) && !lockfile.includes("  is-number: 7.0.0")) {
  console.error("Reproduced: root package.json#resolutions masked pnpm-workspace.yaml#overrides.");
  console.error("is-number resolved to 6.0.0 instead of the workspace override 7.0.0.");
  process.exit(1);
}

if (isNumberApplied && lockfile.includes(expectedConfig)) {
  console.log("No repro: workspace overrides were applied.");
  process.exit(0);
}

console.error("Unexpected lockfile shape. Inspect pnpm-lock.yaml manually.");
process.exit(2);
