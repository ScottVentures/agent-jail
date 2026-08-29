import { spawn, ChildProcess } from 'child_process';
import { SecurityPolicy, ValidationResult } from './policy';

export interface JailExecutionResult {
  isSafe: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  error?: string;
}

export interface JailOptions {
  timeoutMs?: number;   
  env?: Record<string, string>; 
}

export class AgentJail {
  private policy: SecurityPolicy;
  private defaultTimeout: number;
  private allowedEnv: Record<string, string>;

  constructor(policy: SecurityPolicy, options: JailOptions = {}) {
    this.policy = policy;
    this.defaultTimeout = options.timeoutMs || 5000; 
    this.allowedEnv = options.env || { PATH: process.env.PATH || '' };
  }

  public async execute(rawCommand: string, options: JailOptions = {}): Promise<JailExecutionResult> {
    const startTime = Date.now();

    const verification: ValidationResult = this.policy.validate(rawCommand);
    
    if (!verification.isSafe || !verification.sanitizedCommand) {
      return {
        isSafe: false,
        exitCode: 1,
        stdout: '',
        stderr: '',
        executionTimeMs: Date.now() - startTime,
        error: verification.reason || "Security violation blocked execution."
      };
    }

    const timeoutLimit = options.timeoutMs || this.defaultTimeout;
    const runtimeEnv = { ...this.allowedEnv, ...(options.env || {}) };
    const safeCommand: string = verification.sanitizedCommand;

    return new Promise((resolve) => {
      let stdoutData = '';
      let stderrData = '';
      let isTimedOut = false;

      const isWindows = process.platform === 'win32';
      const shellBinary = isWindows ? 'cmd.exe' : '/bin/sh';
      
      // Explicitly declaration maps the array type precisely to satisfy spawn parameters
      const shellArgs: string[] = isWindows 
        ? ['/d', '/s', '/c', safeCommand] 
        : ['-c', safeCommand];

      const child: ChildProcess = spawn(shellBinary, shellArgs, {
        env: runtimeEnv,
        windowsVerbatimArguments: isWindows
      });

      const killTimer = global.setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
      }, timeoutLimit);

      // Guard properties using optional chaining or strict checking since streams can technically be undefined under specific custom stdio configs
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer | string) => {
          stdoutData += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer | string) => {
          stderrData += data.toString();
        });
      }

      child.on('error', (err: Error) => {
        global.clearTimeout(killTimer);
        resolve({
          isSafe: true,
          exitCode: null,
          stdout: stdoutData,
          stderr: stderrData || err.message,
          executionTimeMs: Date.now() - startTime,
          error: `Execution Process Error: ${err.message}`
        });
      });

      child.on('close', (code: number | null) => {
        global.clearTimeout(killTimer);
        
        resolve({
          isSafe: true,
          exitCode: code,
          stdout: stdoutData,
          stderr: isTimedOut ? `${stderrData}\n[AgentJail Timeout Error]: Command execution exceeded limit of ${timeoutLimit}ms.` : stderrData,
          executionTimeMs: Date.now() - startTime,
          error: isTimedOut ? `Timeout Exceeded` : undefined
        });
      });
    });
  }
}
