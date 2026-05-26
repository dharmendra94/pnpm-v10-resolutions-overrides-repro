import { rmSync } from "node:fs";
import { join } from "node:path";

const paths = [
  "node_modules",
  "packages/app/node_modules",
  "pnpm-lock.yaml"
];

for (const path of paths) {
  rmSync(join(process.cwd(), path), { force: true, recursive: true });
}
