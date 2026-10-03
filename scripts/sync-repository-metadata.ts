import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ORGANIZATION = "ankhorage";

const REPOSITORIES = [
  {
    directory: "api",
    packageName: "@ankhorage/api",
    description:
      "Framework-neutral executable API runtime and transport contract for Ankhorage.",
    keywords: [
      "ankhorage",
      "api",
      "api-runtime",
      "adapter",
      "ports-and-adapters",
      "rest",
      "transport",
      "typescript",
    ],
    topics: [
      "ankhorage",
      "api",
      "api-runtime",
      "hexagonal-architecture",
      "ports-and-adapters",
      "rest-api",
      "typescript",
    ],
  },
  {
    directory: "api-fastify",
    packageName: "@ankhorage/api-fastify",
    description:
      "Fastify transport adapter and host integration for the Ankhorage API runtime.",
    keywords: [
      "ankhorage",
      "api",
      "adapter",
      "fastify",
      "http",
      "rest",
      "server",
      "typescript",
    ],
    topics: [
      "ankhorage",
      "api",
      "fastify",
      "http",
      "ports-and-adapters",
      "rest-api",
      "typescript",
    ],
  },
  {
    directory: "api-nextjs",
    packageName: "@ankhorage/api-nextjs",
    description:
      "Next.js App Router transport adapter for the Ankhorage API runtime.",
    keywords: [
      "ankhorage",
      "api",
      "adapter",
      "app-router",
      "nextjs",
      "rest",
      "server",
      "typescript",
    ],
    topics: [
      "ankhorage",
      "api",
      "app-router",
      "nextjs",
      "ports-and-adapters",
      "rest-api",
      "typescript",
    ],
  },
] as const;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoriesRoot = resolve(
  process.env.ANKHORAGE_REPOS_ROOT ?? resolve(scriptDirectory, "../.."),
);

/*** Synchronize npm and GitHub metadata for the canonical Ankhorage API package family. */
async function main(): Promise<void> {
  for (const repository of REPOSITORIES) {
    await updatePackageJson(repository);
    await updateGitHubRepository(repository);
    await updateGitHubTopics(repository);
    console.log(`synchronized ${ORGANIZATION}/${repository.directory}`);
  }
}

/*** Update package.json description and keywords from the canonical metadata table. */
async function updatePackageJson(repository: (typeof REPOSITORIES)[number]): Promise<void> {
  const packagePath = resolve(repositoriesRoot, repository.directory, "package.json");
  const source = await readFile(packagePath, "utf8");
  const packageJson = JSON.parse(source) as Record<string, unknown>;

  if (packageJson.name !== repository.packageName) {
    throw new Error(
      `Expected ${repository.packageName} at ${packagePath}, found ${String(packageJson.name)}`,
    );
  }

  const nextPackageJson = {
    ...packageJson,
    description: repository.description,
    keywords: repository.keywords,
  };

  await writeFile(packagePath, JSON.stringify(nextPackageJson, null, 2) + "\n");
}

/*** Update the GitHub repository description through the authenticated GitHub CLI. */
async function updateGitHubRepository(
  repository: (typeof REPOSITORIES)[number],
): Promise<void> {
  await runGh([
    "api",
    "--method",
    "PATCH",
    `repos/${ORGANIZATION}/${repository.directory}`,
    "-f",
    `description=${repository.description}`,
  ]);
}

/*** Replace GitHub topics with the canonical package-family topic list. */
async function updateGitHubTopics(repository: (typeof REPOSITORIES)[number]): Promise<void> {
  await runGh(
    [
      "api",
      "--method",
      "PUT",
      `repos/${ORGANIZATION}/${repository.directory}/topics`,
      "--input",
      "-",
    ],
    JSON.stringify({ names: repository.topics }),
  );
}

/*** Execute one authenticated GitHub CLI request and fail with its captured output. */
async function runGh(args: readonly string[], stdin?: string): Promise<void> {
  const process = Bun.spawn(["gh", ...args], {
    stdin: stdin === undefined ? "ignore" : new Blob([stdin]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || stdout.trim() || `gh exited with ${exitCode}`);
  }
}

await main();
