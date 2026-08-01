import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import { createHash } from "crypto";
import { readFile, readdir, writeFile, stat, mkdir } from "fs/promises";
import { argv } from "process";
import { rollup, watch } from "rollup";

import swc from "@swc/core";
import esbuild from "rollup-plugin-esbuild";

const args = argv.slice(2);
const inputPlugins = args.filter((x) => !x.startsWith("-"));
const flags = args.map((x) => x.toLowerCase()).filter((x) => x.startsWith("-"));

const isWatch = flags.includes("--watch") || flags.includes("-w");
const isVerbose = flags.includes("--verbose") || flags.includes("-v");
const toBuild = inputPlugins.length ? inputPlugins : await readdir("./plugins");

console.log(`Found ${toBuild.length} plugin(s) to build`);

let built = 0;
let failed = 0;

for (const plugin of toBuild) {
  if (plugin.endsWith(".ts")) continue;

  try {
    console.log(`Building ${plugin}...`);
    await buildPlugin(plugin);
    console.log(`✓ ${plugin}`);
    built++;
  } catch (e) {
    console.log(`✗ ${plugin}`);
    console.error(isVerbose ? e : e.message);
    failed++;
  }
}

console.log(`\nSuccess: ${built}, Failed: ${failed}`);
if (failed > 0 && !isWatch) process.exit(1);

async function buildPlugin(plugin) {
  const manifest = Object.assign(
    JSON.parse(await readFile("./base_manifest.json")),
    JSON.parse(await readFile(`./plugins/${plugin}/manifest.json`)),
  );

  const entry = "index.js";
  const outDir = `./dist/${plugin}`;
  const outPath = `${outDir}/${entry}`;
  await mkdir(outDir, { recursive: true });

  /** @type {import("rollup").RollupOptions} */
  const options = {
    input: `./plugins/${plugin}/${manifest.main}`,
    output: {
      file: outPath,
      globals(id) {
        if (id.startsWith("@vendetta"))
          return id.substring(1).replace(/\//g, ".");

        const map = {
          react: "window.React",
          "react-native": "vendetta.metro.common.ReactNative",
        };

        return map[id] || null;
      },
      format: "iife",
      compact: true,
      exports: "named",
      inlineDynamicImports: true,
    },
    onwarn: (warning) => {
      if (
        ![
          "UNRESOLVED_IMPORT",
          "MISSING_NAME_OPTION_FOR_IIFE_EXPORT",
          "CIRCULAR_DEPENDENCY",
        ].includes(warning.code) &&
        isVerbose
      ) {
        console.warn(`${plugin}: ${warning.message}`);
      }
    },
    plugins: [
      nodeResolve({
        resolveOnly: (id) => !["react", "react-native"].includes(id),
      }),
      commonjs(),
      {
        name: "swc",
        transform(code, id) {
          return swc.transform(code, {
            filename: id,
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              externalHelpers: true,
            },
            env: {
              targets: "defaults",
              include: ["transform-classes", "transform-arrow-functions"],
            },
          });
        },
      },
      esbuild({ minify: true }),
    ],
  };

  const applyHashAndWrite = async () => {
    const content = await readFile(outPath);
    const finalManifest = Object.assign({}, manifest, {
      hash: createHash("sha256").update(content).digest("hex"),
      main: entry,
    });
    await writeFile(`${outDir}/manifest.json`, JSON.stringify(finalManifest));
  };

  if (!isWatch) {
    const bundle = await rollup(options);
    await bundle.write(options.output);
    await bundle.close();
    await applyHashAndWrite();
    const stats = await stat(outPath);
    return { size: stats.size };
  }

  const watcher = watch(options);
  return await new Promise((resolve, reject) => {
    watcher.on("event", async (event) => {
      switch (event.code) {
        case "BUNDLE_END":
          event.result.close();
          await applyHashAndWrite();
          console.log(`⚡ ${plugin} rebuilt (${event.duration}ms)`);
          resolve({ size: 0 });
          break;
        case "ERROR":
        case "FATAL":
          console.error(`✗ ${plugin}`);
          console.error(isVerbose ? event.error : event.error.message);
          reject(event.error);
          break;
      }
    });
  });
}
