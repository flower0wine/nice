interface LogConfig {
  prefix?: string;
  showTimestamp?: boolean;
}

export class Logger {
  private prefix: string;
  private showTimestamp: boolean;

  constructor(config: LogConfig = {}) {
    this.prefix = config.prefix || "[Nice Extension]";
    this.showTimestamp = config.showTimestamp || false;
  }

  private getTimeStamp(): string {
    return this.showTimestamp ? `[${new Date().toISOString()}]` : "";
  }

  private formatMessage(message: string): string {
    return `${this.prefix} ${this.getTimeStamp()} ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage(message), ...args);
  }

  success(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(message)}`, "color: #4caf50", ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage(message), ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    console.error(this.formatMessage(message), error, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage(message), ...args);
    }
  }
}

export const logger = new Logger();
