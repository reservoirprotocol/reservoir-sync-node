import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import { InsertionService } from '../../../services/InsertionService';
import { Tables } from '../../../types';

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

export default handler;
