import "dotenv/config";
import { stdin, stdout } from "node:process";
import { Server } from "./Server";

stdin.pipe(stdout);
process.title = "SyncNode Server Process";

const config = {
  port: Number(process.env.PORT) as number,
  authorization: process.env.AUTHORIZATION as string,
};

Server.construct(config);
Server.launch();

process.on("uncaughtException", (error: Error) => {
  console.error(
    `FATAL ERROR: ${error.message}. Terminating Server Process ${process.pid}`
  );
  process.exit(0);
});

process.on("unhandledRejection", (error: Error) => {
  console.error(
    `FATAL ERROR: ${error.message}. Terminating Server Process ${process.pid}`
  );
  process.exit(0);
});
