import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;
  private logDir: string;
  private logToFile: boolean;
  private sessionId: string;

  constructor() {
    this.level = LogLevel.DEBUG;
    this.logDir = join(process.cwd(), '../logs');
    this.logToFile = true;
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (this.logToFile && !existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, category: string, message: string, data?: Record<string, unknown>): string {
    const timestamp = this.getTimestamp();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${category}] ${message}${dataStr}`;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.logToFile) return;

    const filename = join(this.logDir, `solgrid-${this.sessionId}.log`);
    const line = JSON.stringify(entry) + '\n';

    try {
      appendFileSync(filename, line);
    } catch (err) {
      // Silent fail for file writes
    }
  }

  private log(level: LogLevel, levelStr: string, category: string, message: string, data?: Record<string, unknown>): void {
    if (level < this.level) return;

    const formatted = this.formatMessage(levelStr, category, message, data);

    // Console output with colors
    switch (level) {
      case LogLevel.DEBUG:
        console.log(`\x1b[90m${formatted}\x1b[0m`); // Gray
        break;
      case LogLevel.INFO:
        console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
        break;
      case LogLevel.WARN:
        console.log(`\x1b[33m${formatted}\x1b[0m`); // Yellow
        break;
      case LogLevel.ERROR:
        console.log(`\x1b[31m${formatted}\x1b[0m`); // Red
        break;
    }

    // File output
    this.writeToFile({
      timestamp: this.getTimestamp(),
      level: levelStr,
      category,
      message,
      data,
    });
  }

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', category, message, data);
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, 'INFO', category, message, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, 'WARN', category, message, data);
  }

  error(category: string, message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, 'ERROR', category, message, data);
  }

  // Specialized logging methods for common scenarios

  llmDecision(agentType: string, decision: { action: string; amount: number; priceMultiplier: number; reasoning: string }, durationMs: number): void {
    this.info('LLM', `${agentType} decision`, {
      agent: agentType,
      action: decision.action,
      amount: decision.amount,
      priceMultiplier: decision.priceMultiplier,
      reasoning: decision.reasoning,
      durationMs,
    });
  }

  llmFallback(agentType: string, reason: string): void {
    this.warn('LLM', `${agentType} using fallback strategy`, { agent: agentType, reason });
  }

  agentAction(agentId: string, action: string, details: Record<string, unknown>): void {
    this.info('AGENT', `${agentId}: ${action}`, details);
  }

  trade(trade: { buyerId: string; sellerId: string; amount: number; pricePerUnit: number; totalPrice: number }): void {
    this.info('TRADE', `${trade.sellerId} → ${trade.buyerId}`, {
      amount: trade.amount,
      price: trade.pricePerUnit,
      total: trade.totalPrice,
    });
  }

  marketState(tick: number, price: number, supply: number, demand: number): void {
    this.debug('MARKET', `Tick ${tick}`, { price, supply, demand });
  }

  tick(tickNum: number, simTime: string, day: number): void {
    this.info('TICK', `=== Tick ${tickNum} | ${simTime} (Day ${day}) ===`, { tick: tickNum, simTime, day });
  }

  performance(operation: string, durationMs: number, details?: Record<string, unknown>): void {
    const level = durationMs > 3000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, level === LogLevel.WARN ? 'WARN' : 'DEBUG', 'PERF', `${operation}: ${durationMs}ms`, { durationMs, ...details });
  }

  getLogFilePath(): string {
    return join(this.logDir, `solgrid-${this.sessionId}.log`);
  }
}

export const logger = new Logger();
