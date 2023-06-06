import express, {
  type Application,
  type Request,
  type Response,
} from 'express';

const handler: Application = express();

handler.get('/ping', (_req: Request, _res: Response) => {
  _res.status(200).json({
    error: null,
    data: {
      pong: 'ok!',
    },
  });
});

export default handler;
