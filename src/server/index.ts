import "dotenv/config";
import { Server } from "./Server";
import { stdin, stdout } from "node:process";

stdin.pipe(stdout);

const config = {
  port: Number(process.env.PORT) as number,
  authorization: process.env.AUTHORIZATION as string,
};

Server.construct(config);
Server.launch();

process.on("uncaughtException", (error: Error) => {
  console.log(
    `SyncNode Process Killed. Killing Monitor Service: ${process.pid}`
  );
  console.error(error);
  process.exit(0);
});

process.on("unhandledRejection", (error: Error) => {
  console.log(
    `SyncNode Process Killed. Killing Monitor Service: ${process.pid}`
  );
  console.error(error);
  process.exit(0);
});
