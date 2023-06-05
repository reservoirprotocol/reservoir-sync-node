import 'dotenv/config';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

interface LoggerServiceConfig {
  webhook: {
    endpoint: string;
    events: {
      [key: string]: boolean;
    };
  };
}

interface WebhookEvent {
  title: string;
  level: number;
  timestamp: number;
  trace: string[];
}

export class LoggerService {
  /**
   * # logger
   * Winston logger instance
   * @access private
   */
  private _logger: WinstonLogger;

  /**
   * # config
   * LoggerService configuration object
   * @access private
   */
  private _config: LoggerServiceConfig;

  constructor(config: LoggerServiceConfig) {
    this._config = config;
    this._logger = createLogger({
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
      transports: [new transports.Console()],
    });
  }

  /**
   * Log a message with the 'error' level.
   * This method logs an error message, typically used for reporting application errors or exceptions.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public error = (message: unknown): WinstonLogger =>
    this._logger.error(message + '\n');

  /**
   * Log a message with the 'warn' level.
   * This method logs a warning message, typically used for reporting potential issues or situations that require attention.
   * @param message - The message to log.
   * @returns {void} - void
   */
  public warn = (message: string): WinstonLogger =>
    this._logger.warn(message + '\n');

  /**
   * Log a message with the 'debug' level.
   * This method logs a debug message, typically used for reporting detailed information about the application's internal state, useful for debugging.
   * @param message - The message to log.
   * @returns {void} void
   */
  public debug = (message: string): WinstonLogger =>
    this._logger.debug(message + '\n');

  /**
   * Sends a webhook event
   * @param event Webhook event
   * @returns void
   */
  private async _sendWebhookEvent(event: WebhookEvent): Promise<void> {
    const { timestamp, trace, title, level } = event;
    try {
      const res = await fetch(this._config.webhook.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: title,
          level,
          timestamp,
          trace,
        }),
      });
      if (!res.ok) throw new Error(``);
    } catch (e: unknown) {
      return;
    }
  }
  /**
   * Sends a webhook event
   * @param event Webhook event
   * @returns void
   */
  public sendWebhookEvent = async (event: WebhookEvent): Promise<void> =>
    this._sendWebhookEvent(event);
}
