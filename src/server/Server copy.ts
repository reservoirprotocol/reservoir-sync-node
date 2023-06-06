import express, {
  Handler,
  NextFunction,
  type Application,
  type Request,
  type Response,
} from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { LoggerService } from '../services/LoggerService';
import { Path, SyncNodeConfig } from '../types';
import routes from './routes';
import schema from './Schema';

class _ServerManager {
  /**
   * The Express Application instance.
   * @access private
   */
  private readonly app: Application = express();

  /**
   * The server port number.
   * @access private
   */
  private _PORT: number = 0;

  /**
   * The authorization key for the server.
   * @access private
   */
  private _AUTHORIZATION: string = '';

  // Handler/Controller Variables //

  /**
   * An array of `Path` objects that define the application routes.
   * @access private
   */
  private readonly routes: Path[] = routes;

  /**
   * The middleware function that verifies the authorization key for all routes.
   * @access private
   * @param _req - The request object.
   * @param _res - The response object.
   * @param _next - The next middleware function.
   * @returns {void}
   */
  private readonly middleware: Handler = (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ): void => {
    const authorization = _req.get('Authorization');

    if (authorization !== this._AUTHORIZATION) {
      _res.status(403).json({
        error: {
          status: 403,
          message: 'Unauthorized',
        },
        data: null,
      });
    } else {
      _next('route');
    }
  };

  /**
   * The default handler function that returns a 404 error for undefined routes.
   * @access private
   * @param _req - The request object.
   * @param _res - The response object.
   * @returns {void}
   */
  private readonly defaultHandler: Handler = (
    _req: Request,
    _res: Response
  ): void => {
    _res.status(404).json({
      error: {
        status: 404,
        message: 'Route not found.',
      },
      data: null,
    });
  };

  /**
   * Launches the server manager/express server.
   * @access public
   * @returns {void}
   * @throws Will throw an error if there's an issue starting the server.
   */
  public launch(): void {
    this.app.use('*', this.middleware);
    this.routes.forEach((route) => {
      this.app.use(route.path, route.handlers);
    });

    this.app.use('/graphql', createHandler({ schema }));
    this.app.use('*', this.defaultHandler);

    this.app.listen(this._PORT, () => {
      LoggerService.info(`Server started`);
    });
  }

  public set(config: SyncNodeConfig['server']): void {
    this._PORT = Number(config.port);
    this._AUTHORIZATION = `${config.authorization}`;
  }
}

export const ServerManager = new _ServerManager();
