import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import utils from "../../api/utilities.js";

function runWorker(filePath) {
  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const worker = new Worker(path.resolve(__dirname, "worker.mjs"), {
      workerData: { filePath },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

async function workerPool(files, poolSize) {
  let activeWorkers = 0;
  let idx = 0;

  async function startNextWorker() {
    if (idx < files.length) {
      const file = files[idx++];
      activeWorkers++;
      return runWorker(file).then(() => {
        activeWorkers--;
        return startNextWorker();
      });
    }
  }

  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    pool.push(startNextWorker());
  }

  return Promise.all(pool);
}

const files = JSON.parse(
  fs.readFileSync(`${utils.PROJECT_ROOT}/packageJsonFiles.json`)
);

const ten = 10;
workerPool(files, ten).then(() => console.log("All tasks completed"));
