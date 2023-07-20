import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import path from 'path';

const handler: Application = express();

handler.get('/', async (req: Request, res: Response): Promise<unknown> => {
  return res.sendFile(
    path.join(__dirname, '..', '..', '..', 'viewer', 'index.html')
  );
});

export default handler;
