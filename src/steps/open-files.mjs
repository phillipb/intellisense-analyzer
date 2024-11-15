import utils from "../../../api/utilities.js";
import fs from "fs";

export const openFiles = async (server, seq, filePaths) => {
  const openFilePath = filePaths[0];

  return server.message({
    seq,
    type: "request",
    command: "updateOpen",
    arguments: {
      changedFiles: [],
      closedFiles: [],
      openFiles: [
        {
          file: openFilePath,
          fileContent: await fs.promises.readFile(openFilePath, {
            encoding: "utf-8",
          }),
          scriptKindName: "TS", // It's easy to get this wrong when copy-pasting
        },
      ],
    },
  });
};
