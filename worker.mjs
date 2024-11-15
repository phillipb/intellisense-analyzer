import { parentPort, workerData } from "worker_threads";
import { promises as fs, existsSync } from "fs";
import { launch } from "./scenarios/launch.mjs";

// Destructure the workerData (filePath and value)
const { filePath } = workerData;

const outputFile = path.join(process.cwd(), "tsserver-stats.txt");
// Function to append the value to the file
async function appendToFile(value) {
  try {
    await fs.appendFile(outputFile, `${value}\n`, "utf8");
    // await fs.appendFile(outputFile, `${value}\n`, "utf8");
    // Notify the main thread that the work is done
    parentPort.postMessage("File updated");
  } catch (error) {
    parentPort.postMessage(`Error: ${error.message}`);
  }
}

async function readJsonFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  const inputPackageJson = await readJsonFile(filePath);
  const name = inputPackageJson.name;
  const main = inputPackageJson.main;
  if (!name) {
    console.error(`Error: No package.json found at ${filePath}`);
    parentPort.postMessage(`Error: ${error.message}`);
    return;
  }

  const mainPath = filePath.replace("package.json", main);
  if (existsSync(mainPath)) {
    // launch ts server with the main file
    const stats = await launch(mainPath);
    stats.name = name;
    stats.filePath = mainPath;
    // log metrics to file
    console.log("Stats: ", stats);
    await appendToFile(JSON.stringify(stats));
    parentPort.postMessage("File updated");
  } else {
    parentPort.postMessage(`Error: No main file found at ${mainPath}`);
  }
}

// Execute the function
run();
