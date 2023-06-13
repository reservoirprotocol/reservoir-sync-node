import 'dotenv/config';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';
import { SyncNodeConfig } from '../types';

/**
 * LoggerService class is responsible for handling logging in your application.
 * It uses the Winston package to provide a consistent and clean way of logging.
 * It also supports logging to DataDog and Sentry.
 */
class _LoggerService {
  /**
   * Winston logger instance
   * @access private
   */
  private logger: WinstonLogger;

  /**
   * Creates a new instance of the `LoggerService` class.
   * Initializes the Winston logger with the specified configuration options.
   * If DataDog configuration options are available, adds a new HTTP transport to send logs to DataDog.
   * @constructor
   */
  constructor() {
    this.logger = createLogger({
      levels: {
        info: 0,
        ok: 1,
        error: 2,
      },
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
      transports: [
        new transports.Console({ level: 'info' }),
        new transports.File({ level: 'error', filename: 'application.log' }),
      ],
    });
  }

  public set(config: SyncNodeConfig['logger']): void {
    const datadog = config?.datadog;

    if (datadog && datadog?.apiKey && datadog?.appName) {
      this.logger.transports.push(
        new transports.Http({
          level: datadog.logLevel,
          host: 'http-intake.logs.datadoghq.com',
          path: `/api/v2/logs?dd-api-key=<${datadog.apiKey}>&ddsource=nodejs&service=<${datadog.appName}>`,
          ssl: true,
        })
      );
    }
  }
  /**
   * Log a message with the 'info' level.
   * This method logs an informational message, typically used for reporting general application events.
   * @param message - The message to log.
   * @returns {void} void
   */
  public info(message: string): void {
    this.logger.info(message + '\n');
  }

  /**
   * Log a message with the 'error' level.
   * This method logs an error message, typically used for reporting application errors or exceptions.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public error(message: unknown): void {
    this.logger.error(message + '\n');
  }

  /**
   * Log a message with the 'warn' level.
   * This method logs a warning message, typically used for reporting potential issues or situations that require attention.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public warn(message: string): void {
    this.logger.warn(message + '\n');
  }

  /**
   * Log a message with the 'debug' level.
   * This method logs a debug message, typically used for reporting detailed information about the application's internal state, useful for debugging.
   * @param message - The message to log.
   * @returns {void} void
   */
  public debug(message: string): void {
    this.logger.debug(message + '\n');
  }
}

export const LoggerService = new _LoggerService();
