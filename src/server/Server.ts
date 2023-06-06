import express, { Application, NextFunction, Request, Response } from 'express';
import { createHandler } from 'graphql-http/lib/handler';
import routes from './routes';
import schema from './Schema';

interface ServerConfig {
  port: number;
  authorization: string;
}

class _Server {
  /**
   * The Express Application instance.
   * @access private
   */
  private _app: Application = express();

  /**
   * @access private
   */
  private _config: ServerConfig = {
    port: 0,
    authorization: '',
  };

  /**
   * The default handler function that returns a 404 error for undefined routes.
   * @access private
   * @param _req - The request object.
   * @param _res - The response object.
   * @returns {void}
   */
  private _defaultHandler(_req: Request, _res: Response): void {
    _res.status(404).json({
      error: {
        status: 404,
        message: `Path ${_req.path} not found.`,
      },
      data: null,
    });
  }

  /**
   * Constructs the server
   * @param config ServerConfig
   * @returns void
   */
  public construct(config: ServerConfig) {
    this._config = config;

    this._app.use('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.get('Authorization') !== this._config.authorization) {
        res.status(403).json({
          error: {
            status: 403,
            message: 'Unauthorized',
          },
          data: null,
        });
      } else {
        next('route');
      }
    });

    routes.forEach((route) => {
      this._app.use(route.path, route.handlers);
    });

    this._app.use('/graphql', createHandler({ schema }));

    this._app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: {
          status: 404,
          message: 'Route not found.',
        },
        data: null,
      });
    });
  }
}

export 
const Server = new _Server();
