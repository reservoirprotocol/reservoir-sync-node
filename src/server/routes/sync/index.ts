import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { QueueService } from '../../../services';
import { DataTypes } from '../../../types';

import SyncNode from '../../../SyncNode';

const handler: Application = express();

handler.get(
  '/status',
  async (req: Request, res: Response): Promise<unknown> => {
    const type = req.query?.type as DataTypes;

    const controller = SyncNode.getController(type);

    if (!controller) {
      return res.status(400).json({
        error: {
          status: 400,
          message: `Controller ${type} not found.`,
        },
        data: null,
      });
    }

    return res.status(200).json({
      data: {
        workers: controller.getWorkers().map(({ continuation, data }) => {
          return {
            block: data?.block,
            continuation,
          };
        }),
        queue: await QueueService.getQueueLength(type),
      },
    });
  }
);

handler.post(
  '/create',
  async (req: Request, res: Response): Promise<unknown> => {
    const type = req.query?.type as DataTypes;
    const contract = req?.query.contract as string;

    if (!contract || !type) {
      return res.status(400).json({
        error: {
          status: 400,
          message: `Invalid parameters: ${type}:${contract}`,
        },
        data: null,
      });
    }

    const controller = SyncNode.getController(type);

    if (!controller) {
      return res.status(400).json({
        error: {
          status: 400,
          message: `Controller ${type} not found.`,
        },
        data: null,
      });
    }

    SyncNode.insertContract(contract);

    await controller.addContract(contract);

    return res.status(200).json({
      data: {
        message: `Added contract ${contract}`,
      },
      error: null,
    });
  }
);

export default handler;
