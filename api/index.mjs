const serverDistPath = '../dist/app/server/server.mjs';
export default import(serverDistPath).then((module) => module.app);
