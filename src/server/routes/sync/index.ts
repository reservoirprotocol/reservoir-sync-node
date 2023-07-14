import express, {
  type Application,
  type Request,
  type Response
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

export default handler;
