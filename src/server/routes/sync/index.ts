import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { LightIndexer } from '../../../LightIndexer';
import { InsertionService } from '../../../services/InsertionService';
import { Tables } from '../../../types';
import { isAddress } from '../../../utils';

const handler: Application = express();

handler.get('/status', async (_req: Request, _res: Response) => {
  const { table } = _req.query as { table: Tables };

  const count = await InsertionService.tableCount(table);

  return _res.status(200).json({
    error: null,
    data: {
      count,
    },
  });
});

handler.post('/create', async (_req: Request, _res: Response) => {
  const { type, contract } = _req.query as { type: Tables; contract: string };

  if (!isAddress(contract)) {
    return _res.status(400).json({
      error: {
        status: 400,
        message: `${contract} is not a valid contract.`,
      },
      data: null,
    });
  }

  if (type !== 'sales') {
    return _res.status(400).json({
      error: {
        status: 400,
        message: `${type} is not a valid syncer type.`,
      },
      data: null,
    });
  }

  await LightIndexer.createSyncer(type, contract);

  return _res.status(200).json({
    error: null,
    data: null,
  });
});

export default handler;
