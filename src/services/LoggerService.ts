import fs from 'fs';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';
import { LoggerServiceConfig } from '../types';

/**
 * The _LoggerService class provides an interface to the logging framework.
 * It uses the Winston logging library and supports logging to console, files, and the Datadog service.
 * The log levels used in this service include 'info', 'warn', 'debug', and 'error'.
 */
class _LoggerService {
  /**
   * Winston logger instance
   * @access private
   * @type {WinstonLogger}
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
   * LoggerService configuration object
   * @access private
   * @type {LoggerServiceConfig}
   */
  private _config: LoggerServiceConfig = {
    datadog: {
      apiKey: '',
      appName: '',
    },
  };

  /**
   * Sets up the logger service configuration and adds a new transport for Datadog if required.
   * @param {LoggerServiceConfig} config - Logger service configuration object.
   * @returns {void}
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
   * Logs a message at the 'info' level.
   * @param {unknown} message - The message to log.
   * @returns {WinstonLogger}
   */
  public info(message: unknown): WinstonLogger {
    return this._logger.info(message + '\n');
  }

  /**
   * Logs a message at the 'error' level.
   * @param {unknown} message - The message to log.
   * @returns {WinstonLogger}
   */
  public error(message: unknown): WinstonLogger {
    return this._logger.error(message + '\n');
  }

  /**
   * Logs a message at the 'warn' level.
   * @param {string} message - The message to log.
   * @returns {WinstonLogger}
   */
  public warn(message: string): WinstonLogger {
    return this._logger.warn(message + '\n');
  }

  /**
   * Logs a message at the 'debug' level.
   * @param {string} message - The message to log.
   * @returns {WinstonLogger}
   */
  public debug(message: string): WinstonLogger {
    return this._logger.debug(message + '\n');
  }

  /**
   * Returns the log file
   * @returns Buffer
   */
  public getLogFile(): Buffer | null {
    try {
      return fs.readFileSync(`${__dirname}/application.log`);
    } catch (e: unknown) {
      return null;
    }
  }
}

/**
 * The LoggerService is an instance of the _LoggerService class,
 * allowing for singleton-like usage throughout the application.
 */
export const LoggerService = new _LoggerService();
