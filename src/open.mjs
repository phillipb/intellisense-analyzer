#!/usr/bin/env node

import path from "path";
import process from "process";
import { performance } from "perf_hooks";
import { program } from "commander";
import { harnessUtils } from "./utils/index.mjs";
import { openFiles } from "./steps/open-files.mjs";
import { createServer } from "./utils/create-server.mjs";
import { getStats } from "./utils/telemetry.mjs";
import { formatTable, startProgress } from "./utils/formatter.mjs";

/**
 * @param {string} file
 */
async function main(projectRoot, file, tsserverPath, tsserverMaxOldSpaceSize, format) {
  const stopProgress = startProgress();
  const server = createServer(
    tsserverPath,
    true,
    projectRoot,
    tsserverMaxOldSpaceSize
  );

  let seq = 1;

  await server.message({
    seq: seq++,
    type: "request",
    command: "configure",
    arguments: {
      preferences: {
        includePackageJsonAutoImports: "off",
      },
      watchOptions: {
        excludeDirectories: ["**/node_modules"],
      },
    },
  });

  // Open a file
  const start = performance.now();
  const openFilePath = file;
  const updateOpenResponse = await openFiles(server, seq++, [openFilePath]);
  const end = performance.now();
  const stats = {};
  stats.openTime = end - start;
  stats.updateGraphTime =
    updateOpenResponse.performanceData.updateGraphDurationMs;

  const { memory } = await getStats(server.pid);
  stats.memory = memory;

  const resp = await server.message({
    seq: seq++,
    type: "request",
    command: "projectInfo",
    arguments: {
      file,
      needFileNameList: true,
      needDefaultConfiguredProjectInfo: true,
    },
  });

  stats.fileCount = resp.body.fileNames.length;
  stopProgress();
  // write stats data
  if (format === 'json') {
    console.log(stats);
  } else {
    formatTable(stats);
  }
  await server.exitOrKill(1);
}

program
  .argument("<file>", "File to open")
  .option("-p, --project <project>", "Project to open", process.cwd())
  .option(
    "--tsserver-max-old-space-size <tsserver-max-old-space-size>",
    "Max old space size for tsserver",
    "65536"
  )
  .option(
    "--tsserver-path <tsserver-path>",
    "Path to tsserver.js",
    path.join(process.cwd(), "node_modules", "typescript", "lib", "tsserver.js")
  )
  .option("-f, --format <format>", "Style of format of the output", "json")
  .action(file => {
    const options = program.opts();

    main(
      options.project,
      path.resolve(options.project, file),
      options.tsserverPath,
      options.tsserverMaxOldSpaceSize,
      options.format
    ).catch(e => console.error(e));
  });

program.parse(process.argv);
