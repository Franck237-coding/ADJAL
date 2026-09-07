import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const mobileDirectory = resolve(scriptDirectory, "..");
const packageJson = JSON.parse(
  readFileSync(resolve(mobileDirectory, "package.json"), "utf8"),
);
const require = createRequire(import.meta.url);

const packagesToCheck = ["expo", "expo-constants"];
const versionDrift = [];

for (const packageName of packagesToCheck) {
  const declaredRange =
    packageJson.devDependencies?.[packageName] ??
    packageJson.dependencies?.[packageName];

  if (!declaredRange) {
    versionDrift.push(`${packageName} is not declared in package.json`);
    continue;
  }

  let installedVersion;
  try {
    installedVersion = require(`${packageName}/package.json`).version;
  } catch {
    versionDrift.push(`${packageName} is not installed`);
    continue;
  }

  // Expo's SDK package recommendations are patch-specific. For a tilde
  // declaration, the lower bound is the exact patch version Expo expects.
  const expectedVersion = declaredRange.match(/\d+\.\d+\.\d+/)?.[0];
  if (!expectedVersion || installedVersion !== expectedVersion) {
    versionDrift.push(
      `${packageName}: expected ${expectedVersion ?? declaredRange}, installed ${installedVersion}`,
    );
  }
}

if (versionDrift.length > 0) {
  console.error("Expo compatibility check failed:");
  for (const drift of versionDrift) {
    console.error(`- ${drift}`);
  }
  console.error(
    "Run `pnpm install` or update the Expo package pins before Expo Go validation.",
  );
  process.exit(1);
}

console.log(
  `Checking Expo SDK package compatibility (${packagesToCheck.join(", ")})...`,
);
const expoCheck = spawnSync("pnpm", ["exec", "expo", "install", "--check"], {
  cwd: mobileDirectory,
  stdio: "inherit",
});

if (expoCheck.error) {
  console.error(`Could not run Expo's compatibility check: ${expoCheck.error.message}`);
  process.exit(1);
}

process.exit(expoCheck.status ?? 1);