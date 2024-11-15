import pidusage from "pidusage";

export const logMemory = async pid => {
  const { memory, cpu } = await getStats(pid);

  const b = 1024;
  console.log("*******************");
  console.log(
    `Memory usage for tsserver (PID: ${pid}): ${memory / b / b / b} GB`
  );
  console.log(`CPU usage for tsserver: ${cpu}%`);
  console.log("*******************");
};

export const getStats = pid => pidusage(pid);
