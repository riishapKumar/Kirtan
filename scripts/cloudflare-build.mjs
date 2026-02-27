import { spawnSync } from "node:child_process";

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npx", ["-y", "prisma@5.22.0", "generate"]);

if (process.env.RUN_DB_MIGRATIONS === "true") {
  run("npx", ["-y", "prisma@5.22.0", "migrate", "deploy"]);
} else {
  console.log(
    "Skipping `prisma migrate deploy` (set RUN_DB_MIGRATIONS=true to enable during build).",
  );
}

run("npx", ["-y", "@cloudflare/next-on-pages@1"]);
