// Installs the packed tarball into a temporary consumer and checks every subpath export
// through require, import, and TypeScript resolution.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const subpaths = Object.keys(pkg.exports).filter((key) => key !== "./package.json");
const specifiers = subpaths.map((key) => (key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`));

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const consumer = mkdtempSync(path.join(tmpdir(), "auth-pack-"));
try {
  const tarball = run("npm", ["pack", "--ignore-scripts", "--silent", "--pack-destination", consumer], root).trim().split("\n").pop();
  writeFileSync(path.join(consumer, "package.json"), JSON.stringify({ name: "auth-pack-consumer", private: true, type: "module" }));
  run(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(consumer, tarball), `typescript@${pkg.devDependencies.typescript}`],
    consumer
  );

  for (const specifier of specifiers) {
    const id = JSON.stringify(specifier);
    const cjsKeys = JSON.parse(
      run("node", ["--input-type=commonjs", "-e", `console.log(JSON.stringify(Object.keys(require(${id})).sort()))`], consumer)
    );
    const esmKeys = JSON.parse(
      run(
        "node",
        [
          "--input-type=module",
          "-e",
          `const m = await import(${id}); console.log(JSON.stringify(Object.keys(m).filter((k) => k !== "default" && k !== "module.exports").sort()))`,
        ],
        consumer
      )
    );
    if (cjsKeys.length === 0) throw new Error(`${specifier} has no exports`);
    if (JSON.stringify(cjsKeys) !== JSON.stringify(esmKeys)) throw new Error(`${specifier} exports differ between require and import`);
    console.log(`ok ${specifier}: ${cjsKeys.length} exports through require and import`);
  }

  const version = run(
    "node",
    ["--input-type=module", "-e", `const { version } = await import("${pkg.name}/core"); console.log(version)`],
    consumer
  ).trim();
  if (version !== pkg.version) throw new Error(`core version is ${version}, expected ${pkg.version}`);
  console.log(`ok version ${version}`);

  writeFileSync(
    path.join(consumer, "index.ts"),
    specifiers.map((s, i) => `import * as m${i} from "${s}";\nexport const k${i} = Object.keys(m${i});`).join("\n")
  );
  writeFileSync(
    path.join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "nodenext",
        moduleResolution: "nodenext",
        target: "es2022",
        lib: ["ES2024", "DOM"],
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      files: ["index.ts"],
    })
  );
  run("npx", ["tsc", "-p", "."], consumer);
  console.log("ok types resolve for every subpath");
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
