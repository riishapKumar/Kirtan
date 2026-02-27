import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

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

const replaceSymlinkWithCopy = (path) => {
  const linkedPath = resolve(dirname(path), readlinkSync(path));
  const tempPath = mkdtempSync(join(tmpdir(), "cf-pages-link-"));
  const stagedPath = join(tempPath, "target");

  cpSync(linkedPath, stagedPath, { recursive: true, force: true });
  rmSync(path, { recursive: true, force: true });
  renameSync(stagedPath, path);
  rmSync(tempPath, { recursive: true, force: true });
};

const inlineSymlinks = (rootPath) => {
  if (!existsSync(rootPath)) {
    return;
  }

  const stack = [rootPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (!currentPath) {
      continue;
    }

    for (const entry of readdirSync(currentPath)) {
      const fullPath = join(currentPath, entry);
      const stats = lstatSync(fullPath);

      if (stats.isSymbolicLink()) {
        replaceSymlinkWithCopy(fullPath);
        const nextStats = lstatSync(fullPath);

        if (nextStats.isDirectory()) {
          stack.push(fullPath);
        }

        continue;
      }

      if (stats.isDirectory()) {
        stack.push(fullPath);
      }
    }
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

inlineSymlinks(".vercel/output/static");
