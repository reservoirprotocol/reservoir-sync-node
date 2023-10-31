import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { DataTypes } from "../../../types";
import { Server } from "../../Server";

const handler: Application = express();

handler.get("/queue", async (req: Request, res: Response): Promise<unknown> => {
  const type = req.query?.type as DataTypes;

  const responses = await Promise.allSettled([
    Server.getAllBlocks(type, 1),
    Server.getAllBlocks(type, 2),
    Server.getAllBlocks(type, 3),
    Server.getBackups(),
  ]);

  return res.status(200).json({
    data: {
      blocks: responses[0].status === "fulfilled" ? responses[0].value : [],
      backups: responses[1].status === "fulfilled" ? responses[1].value : {},
    },
  });
});

handler.get(
  "/insertions",
  async (req: Request, res: Response): Promise<unknown> => {
    return res.status(200).json({
      data: Server.getInsertions(),
    });
  }
);

handler.post(
  "/create",
  async (req: Request, res: Response): Promise<unknown> => {
    const type = req.query?.type as DataTypes;
    const contract = req?.query.contract as string;
    const backfill = req?.query.backfill as string;

    if (!contract || !type || backfill == null || backfill == undefined) {
      return res.status(400).json({
        error: {
          status: 400,
          message: `Invalid parameters: ${type}:${contract}:${backfill}`,
        },
        data: null,
      });
    }

    process?.send?.({
      command: "contract_add",
      dataType: type,
      backfill: backfill == "true",
      contract,
    });

    return res.status(200).json({
      data: {
        message: `Request submitted to add contract: ${contract}`,
      },
      error: null,
    });
  }
);

export default handler;
