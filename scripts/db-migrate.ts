import { spawn } from "node:child_process";
import { resolve } from "node:path";

function runNodeScript(scriptPath: string, args: string[] = []): Promise<number> {
  return new Promise((resolveExitCode, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => resolveExitCode(code ?? 1));
  });
}

async function migrateDatabase() {
  const drizzleCli = resolve(process.cwd(), "node_modules/drizzle-kit/bin.cjs");
  const tsxCli = resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");

  const migrationExitCode = await runNodeScript(drizzleCli, ["migrate"]);
  // Always run the idempotent schema repair. Older migration ledgers can cause
  // Drizzle to skip a migration even when this required column is absent.
  const repairExitCode = await runNodeScript(tsxCli, [
    "src/lib/db/migrations/ensure-must-change-password.ts",
  ]);

  if (migrationExitCode !== 0) {
    process.exitCode = migrationExitCode;
  } else if (repairExitCode !== 0) {
    process.exitCode = repairExitCode;
  }
}

migrateDatabase().catch((error: unknown) => {
  console.error("Database migration command failed:", error);
  process.exitCode = 1;
});
