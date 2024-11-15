import { performance } from "perf_hooks";
import { openFiles } from "../steps/open-files.mjs";
import { createServer } from "../utils/create-server.mjs";
import { getStats } from "../utils/telemetry.mjs";

/**
 * @param {string} file
 * @returns {Promise<{ memory: number, duration: number }>}
 */
export async function launch(file) {
  const server = createServer(undefined, true);

  let seq = 1;

  await server.message({
    seq: seq++,
    type: "request",
    command: "configure",
    arguments: {
      preferences: {
        includePackageJsonAutoImports: "auto",
      },
      watchOptions: {
        excludeDirectories: ["**/node_modules"],
      },
    },
  });

  // Open a file
  const start = performance.now();
  const updateOpenResponse = await openFiles(server, seq++, [file]);
  const end = performance.now();
  const stats = await getStats(server.pid);

  await server.exitOrKill(1);

  return { memory: stats.memory, duration: end - start };
}
