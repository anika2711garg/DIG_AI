/**
 * Build the base sandbox templates in E2B's cloud (no local Docker).
 *   set -a; source .env; set +a; npx tsx scripts/build-template.ts [python|node]
 *
 * With no argument, builds every template. Each is a cached image so per-run
 * sandboxes start in seconds and run tests fully network-off:
 *   - issue-to-pr-pytest : python:3.11 + pytest
 *   - issue-to-pr-node   : node:22   + vitest (baked into /home/user/node_modules
 *                          so `import 'vitest'` resolves from the run cwd, with the
 *                          bin symlinked onto PATH)
 * Per-repo templates (deps baked in) can extend these later.
 */
import { GO_TEMPLATE, NODE_TEMPLATE, PYTEST_TEMPLATE, RUST_TEMPLATE } from "@libs/integrations/e2b";
import { Template, defaultBuildLogger, type TemplateBuilder } from "e2b";

const VITEST_VERSION = "2.1.9";

/** python:3.11 + pytest. */
function pythonTemplate(): TemplateBuilder {
  return Template().fromPythonImage("3.11").pipInstall(["pytest==8.3.4"]);
}

/**
 * node:22 + vitest. Vitest is installed LOCALLY at /home/user (an ancestor of the
 * run cwd /home/user/work) so a model-written `import { test } from 'vitest'`
 * resolves by walking up node_modules; the bin is symlinked onto PATH so the
 * `vitest run …` command works from any cwd.
 */
function nodeTemplate(): TemplateBuilder {
  return Template()
    .fromNodeImage("22")
    .setWorkdir("/home/user")
    .runCmd("npm init -y")
    .npmInstall([`vitest@${VITEST_VERSION}`])
    // Symlink as root — the build user can't write /usr/local/bin.
    .makeSymlink("/home/user/node_modules/.bin/vitest", "/usr/local/bin/vitest", {
      user: "root",
      force: true,
    });
}

/**
 * go:1.22 + gotestsum. The E2B runtime PATH is a fixed /usr/local/bin:/usr/bin:/bin
 * (the image's own PATH is NOT applied), and build steps run as a NON-root user, so
 * we install as root and land every runtime binary on /usr/local/bin: gotestsum via
 * GOBIN, and a `go` symlink (gotestsum shells out to `go test`). GOCACHE/GOPATH
 * default under the writable $HOME, so no runtime env is required.
 */
function goTemplate(): TemplateBuilder {
  return Template()
    .fromImage("golang:1.24")
    .runCmd("GOBIN=/usr/local/bin /usr/local/go/bin/go install gotest.tools/gotestsum@latest", {
      user: "root",
    })
    .makeSymlink("/usr/local/go/bin/go", "/usr/local/bin/go", { user: "root", force: true })
    .setEnvs({ GOPROXY: "off", GOFLAGS: "-mod=mod", GOTOOLCHAIN: "local" });
}

/**
 * rust:1.82 + cargo-nextest (prebuilt binary — fast, vs. compiling from source).
 * Same PATH constraint as Go: install as root and symlink cargo + rustc onto
 * /usr/local/bin. The run user's default CARGO_HOME (~/.cargo) is made writable for
 * cargo's package-cache lock, and ~/.rustup is symlinked to the baked toolchain so
 * the rustup proxies resolve it without any runtime env.
 */
function rustTemplate(): TemplateBuilder {
  return Template()
    .fromImage("rust:1.82")
    .aptInstall(["curl"])
    .runCmd("curl -LsSf https://get.nexte.st/latest/linux | tar zxf - -C /usr/local/bin cargo-nextest", {
      user: "root",
    })
    .runCmd("mkdir -p /home/user/.cargo && chmod -R 0777 /home/user/.cargo", { user: "root" })
    .makeSymlink("/usr/local/cargo/bin/cargo", "/usr/local/bin/cargo", { user: "root", force: true })
    .makeSymlink("/usr/local/cargo/bin/rustc", "/usr/local/bin/rustc", { user: "root", force: true })
    .makeSymlink("/usr/local/rustup", "/home/user/.rustup", { user: "root", force: true })
    .setEnvs({ CARGO_NET_OFFLINE: "true" });
}

const TEMPLATES: Record<string, { name: string; build: () => TemplateBuilder }> = {
  python: { name: PYTEST_TEMPLATE, build: pythonTemplate },
  node: { name: NODE_TEMPLATE, build: nodeTemplate },
  go: { name: GO_TEMPLATE, build: goTemplate },
  rust: { name: RUST_TEMPLATE, build: rustTemplate },
};

async function buildOne(key: string, apiKey: string) {
  const spec = TEMPLATES[key]!;
  console.log(`\n▸ building ${spec.name} …`);
  const info = await Template.build(spec.build(), spec.name, {
    apiKey,
    onBuildLogs: defaultBuildLogger({ minLevel: "info" }),
  });
  console.log(`✓ built '${info.name}'  templateId=${info.templateId}  build=${info.buildId}`);
}

async function main() {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) throw new Error("E2B_API_KEY is required");

  const arg = process.argv[2];
  const keys = arg ? [arg] : Object.keys(TEMPLATES);
  for (const key of keys) {
    if (!TEMPLATES[key]) throw new Error(`unknown template '${key}' (expected: ${Object.keys(TEMPLATES).join(", ")})`);
    await buildOne(key, apiKey);
  }
}

main().catch((err) => {
  console.error("template build failed:", err);
  process.exit(1);
});
