export const getProjectInfo = async (server, seq) => {
  return server.message({
    seq,
    type: "request",
    command: "projectInfo",
    arguments: {
      needFileNameList: false,
      needDefaultConfiguredProjectInfo: true,
    },
  });
};
