#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const SOURCE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".dart",
  ".ex",
  ".exs",
  ".go",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".kts",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scala",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
]);

const TEST_PATTERNS = [
  /\.test\.[a-z]+$/i,
  /\.spec\.[a-z]+$/i,
  /_test\.[a-z]+$/i,
  /(^|\/)[^/]*\.tests?\//i,
  /(^|\/)[^/]*tests?\.cs$/i,
  /(^|\/)[^/]*\.tests?\.csproj$/i,
  /^tests?\//i,
  /\/__tests__\//i,
  /\/tests?\//i,
];

const DOC_PATTERNS = [
  /^readme/i,
  /^contributing/i,
  /^changelog/i,
  /^docs?\//i,
  /^documentation\//i,
  /\.md$/i,
  /\.mdx$/i,
  /\.rst$/i,
  /^adr\//i,
  /^adrs?\//i,
];

const CONFIG_PATTERNS = [
  /^\./,
  /config\./i,
  /\.config\./i,
  /\.json$/i,
  /\.ya?ml$/i,
  /\.toml$/i,
  /\.slnx?$/i,
  /\.(cs|fs|vb)proj$/i,
  /(^|\/)Directory\.Build\.(props|targets)$/i,
  /(^|\/)Directory\.Packages\.props$/i,
  /(^|\/)global\.json$/i,
  /(^|\/)NuGet\.config$/i,
  /\.runsettings$/i,
  /^makefile$/i,
  /^justfile$/i,
  /^dockerfile/i,
  /\.lock$/i,
];

const CI_PATTERNS = [
  /^\.github\/workflows\//i,
  /^\.gitlab-ci/i,
  /^\.circleci\//i,
  /^\.buildkite\//i,
  /^\.travis\.yml$/i,
  /^Jenkinsfile/i,
];

const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)\.netrc$/i,
  /(^|\/)\.aws\/credentials$/i,
  /(^|\/)\.docker\/config\.json$/i,
  /(^|\/)id_[a-z0-9_-]+$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /service-account.*\.json$/i,
  /credentials.*\.json$/i,
  /secrets?($|[._-])/i,
  /token($|[._-])/i,
  /(^|\/)appsettings\.local\.json$/i,
  /(^|\/)appsettings\..*\.local\.json$/i,
  /(^|\/)appsettings\..*secrets?.*\.json$/i,
  /(^|\/)deployment\/.*(secret|token|credential).*$/i,
];

const AGENT_GUIDANCE_PATTERNS = [
  /(^|\/)AGENTS(\.[^/]*)?\.md$/i,
  /(^|\/)\.agents\/skills\/[^/]+\/SKILL\.md$/i,
  /(^|\/)\.ai\/agents\//i,
  /(^|\/)\.cursorrules$/i,
  /(^|\/)\.cursor\/rules\//i,
];

const TOOLING_INTERNAL_PATTERNS = [
  /(^|\/)\.agents\//i,
  /(^|\/)\.claude\//i,
  /(^|\/)\.codex\//i,
  /(^|\/)\.opencode\//i,
  /(^|\/)\.tl-ai-kit\//i,
];

const LANGUAGE_BY_EXTENSION = {
  ".c": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cs": "csharp",
  ".dart": "dart",
  ".ex": "elixir",
  ".exs": "elixir",
  ".go": "go",
  ".java": "java",
  ".js": "javascript",
  ".jsx": "javascript",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".mjs": "javascript",
  ".php": "php",
  ".py": "python",
  ".rb": "ruby",
  ".rs": "rust",
  ".scala": "scala",
  ".swift": "swift",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".vue": "vue",
};

function main() {
  const repoPath = resolve(process.argv[2] || ".");
  const allFiles = listRepoFiles(repoPath);
  const sensitiveFiles = allFiles.filter(isSensitivePath);
  const agentGuidanceFiles = allFiles.filter(isAgentGuidanceFile);
  const toolingInternalFiles = allFiles.filter(isToolingInternalFile);
  const productFiles = allFiles.filter(
    (file) =>
      !isSensitivePath(file) &&
      !isToolingInternalFile(file) &&
      !isAgentGuidanceFile(file),
  );
  const files = allFiles.filter((file) => !isSensitivePath(file));
  const packageJson = readJson(repoPath, "package.json");
  const classified = classifyFiles(productFiles);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    repoPath,
    skill: {
      name: "tl-repo-agent-readiness",
      snapshotVersion: "1.0.0",
    },
    repoType: detectRepoType(files, packageJson),
    runtime: detectRuntime(files, packageJson),
    packageManager: detectPackageManager(files, packageJson),
    fileCounts: {
      total: files.length,
      source: classified.source.length,
      test: classified.test.length,
      docs: classified.doc.length,
      config: classified.config.length,
      ci: classified.ci.length,
      agentGuidance: agentGuidanceFiles.length,
      toolingInternal: toolingInternalFiles.length,
      excludedSensitive: sensitiveFiles.length,
    },
    languages: detectLanguages(productFiles),
    topLevelEntries: summarizeTopLevel(productFiles),
    rootDocs: classified.doc.filter((file) => !file.includes("/")).slice(0, 10),
    rootConfigs: classified.config
      .filter((file) => !file.includes("/"))
      .slice(0, 12),
    scripts: summarizeScripts(packageJson?.scripts || {}),
    ciFiles: classified.ci.slice(0, 12),
    agentGuidanceFiles: sortAgentGuidanceFiles(agentGuidanceFiles).slice(0, 30),
    toolingInternalFiles: toolingInternalFiles.slice(0, 30),
    excludedSensitiveFiles: sensitiveFiles.slice(0, 20),
    workspacePackages: findWorkspacePackages(productFiles),
    largeSourceFiles: findLargestFiles(repoPath, classified.source),
    importantFiles: findImportantFiles(productFiles, classified, agentGuidanceFiles),
  };

  snapshot.readingOrder = snapshot.importantFiles
    .slice(0, 12)
    .map((entry) => entry.path);

  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

function listRepoFiles(repoPath) {
  if (existsSync(join(repoPath, ".git"))) {
    try {
      const tracked = execSync("git ls-files", {
        cwd: repoPath,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      })
        .split("\n")
        .filter(Boolean);
      const untracked = execSync("git ls-files --others --exclude-standard", {
        cwd: repoPath,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      })
        .split("\n")
        .filter(Boolean);

      return [...new Set([...tracked, ...untracked])]
        .map(normalizePath)
        .sort((a, b) => a.localeCompare(b));
    } catch {
      // Fall through to manual walk.
    }
  }

  return manualWalk(repoPath, repoPath).sort((a, b) => a.localeCompare(b));
}

function manualWalk(basePath, currentPath, results = []) {
  const skip = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    ".turbo",
    ".cache",
    "target",
    "bin",
    "obj",
    "vendor",
  ]);

  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;

    const absolute = join(currentPath, entry.name);
    const relativePath = normalizePath(absolute.slice(basePath.length + 1));

    if (entry.isDirectory()) {
      manualWalk(basePath, absolute, results);
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }

  return results;
}

function classifyFiles(files) {
  return {
    source: files.filter(isSourceFile),
    test: files.filter(isTestFile),
    doc: files.filter((file) => matchesAny(file, DOC_PATTERNS)),
    config: files.filter((file) => matchesAny(file, CONFIG_PATTERNS)),
    ci: files.filter((file) => matchesAny(file, CI_PATTERNS)),
  };
}

function detectRepoType(files, packageJson) {
  const hasPackages = files.some((file) => /^packages\//.test(file));
  const hasApps = files.some((file) => /^apps\//.test(file));
  const hasServices = files.some((file) => /^services?\//.test(file));
  const hasSrc = files.some((file) => /^src\//.test(file));
  const hasTests = files.some((file) => /^tests?\//.test(file));
  const hasSamples = files.some((file) => /^samples?\//.test(file));
  const hasSolution = files.some((file) => /\.slnx?$/i.test(file));
  const hasDotnetProject = files.some((file) => /\.(cs|fs|vb)proj$/i.test(file));
  const hasFrontend = files.some((file) =>
    /^(src|app|pages)\/.*\.(tsx|jsx|vue|svelte)$/.test(file),
  );
  const hasCliBin = Boolean(packageJson?.bin);

  if (hasPackages || (hasApps && hasServices)) return "monorepo";
  if (hasSolution && (hasSrc || hasTests || hasSamples)) return "monorepo";
  if (hasCliBin) return "cli";
  if (hasServices) return "service";
  if (hasDotnetProject && hasSrc) return "service";
  if (hasFrontend) return "app";
  if (hasDotnetProject) return "library";
  if (packageJson?.main || packageJson?.exports) return "library";
  return "unknown";
}

function detectRuntime(files, packageJson) {
  if (
    files.some((file) =>
      /\.(sln|slnx|csproj|fsproj|vbproj)$/i.test(file),
    )
  ) {
    return "dotnet";
  }
  if (files.includes("go.mod")) return "go";
  if (files.includes("Cargo.toml")) return "rust";
  if (files.includes("pyproject.toml")) return "python";
  if (packageJson) return "node";
  return "unknown";
}

function detectPackageManager(files, packageJson) {
  if (files.includes("paket.dependencies")) return "paket";
  if (files.some((file) => /^NuGet\.config$/i.test(file))) return "nuget";
  if (
    files.some((file) =>
      /\.(sln|slnx|csproj|fsproj|vbproj)$/i.test(file),
    )
  ) {
    return "dotnet";
  }
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
  if (files.includes("uv.lock")) return "uv";
  if (files.includes("poetry.lock")) return "poetry";
  if (files.includes("Cargo.lock")) return "cargo";
  if (files.includes("go.mod")) return "go";
  if (packageJson) return "npm-or-compatible";
  return "unknown";
}

function detectLanguages(files) {
  const counts = new Map();

  for (const file of files) {
    const language = LANGUAGE_BY_EXTENSION[extname(file).toLowerCase()];
    if (!language) continue;
    counts.set(language, (counts.get(language) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count }));
}

function summarizeTopLevel(files) {
  const counts = new Map();

  for (const file of files) {
    const [top] = file.split("/");
    counts.set(top, (counts.get(top) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));
}

function summarizeScripts(scripts) {
  return Object.entries(scripts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => ({ name, command }));
}

function findWorkspacePackages(files) {
  return files
    .filter((file) => /(^|\/)package\.json$/.test(file) && file !== "package.json")
    .slice(0, 30);
}

function findLargestFiles(repoPath, files) {
  return files
    .map((file) => {
      try {
        return { path: file, bytes: statSync(join(repoPath, file)).size };
      } catch {
        return { path: file, bytes: 0 };
      }
    })
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);
}

function findImportantFiles(files, classified, agentGuidanceFiles = []) {
  const important = [];
  const add = (path, reason) => {
    if (!path || important.some((entry) => entry.path === path)) return;
    important.push({ path, reason });
  };

  for (const file of sortAgentGuidanceFiles(agentGuidanceFiles).slice(0, 8)) {
    add(file, "agent guidance");
  }

  for (const candidate of [
    "README.md",
    "AGENTS.md",
    "AGENTS.local.md",
    "package.json",
    "global.json",
    "NuGet.config",
    "Directory.Build.props",
    "Directory.Build.targets",
    "Directory.Packages.props",
    "pnpm-lock.yaml",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "next.config.js",
    ".github/workflows/ci.yml",
    ".github/workflows/test.yml",
    ".gitlab-ci.yml",
  ]) {
    if (files.includes(candidate)) add(candidate, "canonical root file");
  }

  for (const file of classified.doc.slice(0, 8)) add(file, "documentation");
  for (const file of classified.ci.slice(0, 5)) add(file, "automation");
  for (const file of classified.config.slice(0, 8)) add(file, "configuration");
  for (const file of files.filter((file) => /\.slnx?$/i.test(file)).slice(0, 5)) {
    add(file, "dotnet solution");
  }
  for (const file of files.filter((file) => /\.(cs|fs|vb)proj$/i.test(file)).slice(0, 10)) {
    add(file, "dotnet project");
  }
  for (const file of classified.source.slice(0, 10)) add(file, "representative source");
  for (const file of classified.test.slice(0, 6)) add(file, "representative test");

  return important.slice(0, 40);
}

function readJson(repoPath, file) {
  try {
    return JSON.parse(readFileSync(join(repoPath, file), "utf8"));
  } catch {
    return null;
  }
}

function isSourceFile(file) {
  return SOURCE_EXTENSIONS.has(extname(file).toLowerCase()) && !isTestFile(file);
}

function isTestFile(file) {
  return matchesAny(file, TEST_PATTERNS);
}

function isSensitivePath(file) {
  return matchesAny(file, SENSITIVE_PATH_PATTERNS);
}

function isAgentGuidanceFile(file) {
  return matchesAny(file, AGENT_GUIDANCE_PATTERNS);
}

function isToolingInternalFile(file) {
  return matchesAny(file, TOOLING_INTERNAL_PATTERNS);
}

function sortAgentGuidanceFiles(files) {
  return [...files].sort((a, b) => {
    const aRoot = !a.includes("/");
    const bRoot = !b.includes("/");
    if (aRoot !== bRoot) return aRoot ? -1 : 1;
    return a.localeCompare(b);
  });
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

main();
