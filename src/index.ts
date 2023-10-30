import "dotenv/config";
import SyncNode from "./SyncNode";
import { LoggerService } from "services";

SyncNode.launch();

process.on("uncaughtException", (e) => {
  LoggerService.error(e);
});

process.on("unhandledRejection", (e) => {
  LoggerService.error(e);
});
