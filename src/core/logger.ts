import * as fs from 'fs';
import * as path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  taskId: string;
  command: string;
  isSafe: boolean;
  exitCode: number | null;
  executionTimeMs: number;
  errorLog: string;
}

export class AuditLogger {
  private logFilePath: string;

  constructor(customPath?: string) {
    // Default to an automated logs directory in the project root execution context
    const targetDir = customPath ? path.dirname(customPath) : path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.logFilePath = customPath || path.join(targetDir, 'agent_audit_trail.csv');
    
    // Initialize the structure with production CSV header maps if the file is new
    if (!fs.existsSync(this.logFilePath)) {
      const headers = 'Timestamp,Task_ID,Command,Passed_Security,Exit_Code,Duration_MS,Error_Message\n';
      fs.writeFileSync(this.logFilePath, headers, 'utf8');
    }
  }

  /**
   * Appends an immutable row entry containing execution parameters straight to disk storage.
   */
  public logEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const timestamp = new Date().toISOString();
    
    // Escape quote structures to secure CSV text fields against data corruption layout shifts
    const safeCommand = `"${entry.command.replace(/"/g, '""')}"`;
    const safeError = `"${(entry.errorLog || '').replace(/"/g, '""')}"`;
    const exitCodeStr = entry.exitCode !== null ? entry.exitCode.toString() : 'KILLED';

    const csvRow = `${timestamp},${entry.taskId},${safeCommand},${entry.isSafe},${exitCodeStr},${entry.executionTimeMs},${safeError}\n`;

    fs.appendFileSync(this.logFilePath, csvRow, 'utf8');
  }

  public getLogPath(): string {
    return this.logFilePath;
  }
}
