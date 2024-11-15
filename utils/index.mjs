import { logMemory } from "./telemetry.mjs";

export const harnessUtils = server => {
  return {
    logMemory: async () => {
      await logMemory(server.pid);
    },
  };
};
