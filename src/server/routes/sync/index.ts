import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { QueueService } from '../../../services';
import { DataTypes } from '../../../types';

import SyncNode from '../../../SyncNode';

const handler: Application = express();

handler.get('/status', (req: Request, res: Response) => {
  const type = req.params?.type as DataTypes;

  const controller = SyncNode.getController('asks');
  if (!controller) {
    return res.status(400).json({
      error: {
        status: 400,
        message: `Controller ${type}`,
      },
      data: null,
    });
  }

  const workers = controller.getWorkers();

  return res.status(200).json({
    data: {
      workers: workers.map(({ continuation, data }) => {
        return {
          block: data?.block,
          continuation,
        };
      }),
      queue: QueueService.getQueueLength(type),
    },
  });
});
