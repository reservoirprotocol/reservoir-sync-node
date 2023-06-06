import 'dotenv/config';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

interface LoggerServiceConfig {
  datadog: {
    apiKey: string;
    appName: string;
  };
  webhook: {
    endpoint: string;
    events: {
      [key: string]: boolean;
    };
  };
}

class _LoggerService {
  /**
   * # logger
   * Winston logger instance
   * @access private
   */
  private _logger: WinstonLogger = createLogger({
    level: 'info',
    exitOnError: false,
    format: format.combine(
      format.json(),
      format.colorize({ all: true }),
      format.label({ label: 'sync-node' }),
      format.timestamp({ format: 'HH:mm:ss:ms' }),
      format.printf(
        (info) => `[${info.label}] [${info.timestamp}] ${info.message}`
      )
    ),
    transports: [new transports.File(), new transports.Console()],
  });

  /**
   * # config
   * LoggerService configuration object
   * @access private
   */
  private _config: LoggerServiceConfig = {
    datadog: {
      apiKey: '',
      appName: '',
    },
    webhook: {
      endpoint: '',
      events: {},
    },
  };

  /**
   *
   * @param config LoggerServiceConfig
   */
  public construct(config: LoggerServiceConfig): void {
    this._config = config;

    if (
      this._config.datadog &&
      this._config.datadog?.apiKey &&
      this._config.datadog?.appName
    ) {
      this._logger.transports.push(
        new transports.Http({
          host: 'http-intake.logs.datadoghq.com',
          path: `/api/v2/logs?dd-api-key=<${this._config.datadog.apiKey}>&ddsource=nodejs&service=<${this._config.datadog.appName}>`,
          ssl: true,
        })
      );
    }
  }
  /**
   * Log a message with the 'info' level.
   * This method logs an inf message, typically used for reporting application info.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public info(message: unknown): WinstonLogger {
    return this._logger.info(message + '\n');
  }
  /**
   * Log a message with the 'error' level.
   * This method logs an error message, typically used for reporting application errors or exceptions.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public error(message: unknown): WinstonLogger {
    return this._logger.error(message + '\n');
  }

  /**
   * Log a message with the 'warn' level.
   * This method logs a warning message, typically used for reporting potential issues or situations that require attention.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public warn(message: string): WinstonLogger {
    return this._logger.warn(message + '\n');
  }

  /**
   * Log a message with the 'debug' level.
   * This method logs a debug message, typically used for reporting detailed information about the application's internal state, useful for debugging.
   * @param message - The message to log.
   * @returns {void} void
   */
  public debug(message: string): WinstonLogger {
    return this._logger.debug(message + '\n');
  }
}

export const LoggerService = new _LoggerService();
