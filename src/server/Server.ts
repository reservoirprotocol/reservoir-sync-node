import express, { Application, NextFunction, Request, Response } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { GraphQlService, LoggerService } from '../services';
import { ServerConfig } from '../types';
import routes from './routes';

/**
 * The _Server class encapsulates an Express application and provides methods for
 * setting up the server, including route handlers and middleware.
 */
class _Server {
  /**
   * The Express application instance.
   * @access private
   * @type {Application}
   */
  private _app: Application = express();

  /**
   * Configuration object for the server.
   * @access private
   * @type {ServerConfig}
   */
  private _config: ServerConfig = {
    port: 0,
    authorization: '',
  };

  /**
   * Launches the server and starts listening on the configured port.
   * @returns {Promise<void>}
   */
  public async launch(): Promise<void> {
    return new Promise((resolve) => {
      this._app.listen(this._config.port, () => {
        LoggerService.info(`Launched Server on ${this._config.port}`);
        resolve();
      });
    });
  }

  /**
   * Configures the server with routes, middleware, and other settings.
   * @param {ServerConfig} config - Server configuration object.
   * @returns {void}
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

    Object.keys(GraphQlService.getSchema()).forEach((key) => {
      this._app.use(
        `/graphql/${key}/`,
        createHandler({ schema: GraphQlService.getSchema()[''] })
      );
    });

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

/**
 * The Server object is an instance of the _Server class,
 * allowing for singleton-like usage throughout the application.
 */
export const Server = new _Server();
