import { SecurityPolicy, AgentJail, VirtualFileSystem } from '../src';

describe('Agent-Jail Complete Security Suite', () => {
  let policy: SecurityPolicy;
  let jail: AgentJail;
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    policy = new SecurityPolicy({
      allowedPaths: ['/project/workspace'],
      blockedCommands: ['sudo', 'rm', 'mv']
    });
    // Lower baseline pool timeouts to keep test cycles fast
    jail = new AgentJail(policy, { timeoutMs: 1000 });
    vfs = new VirtualFileSystem();
  });

  // --- POLICY ENGINE TESTS ---
  describe('SecurityPolicy Rules', () => {
    it('should pass harmless standard commands', () => {
      const result = policy.validate("echo 'hello'");
      expect(result.isSafe).toBe(true);
    });

    it('should block explicit blacklisted binaries like rm', () => {
      const result = policy.validate("rm -rf /");
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('blacklisted');
    });

    it('should catch relative path traversal breakouts', () => {
      const result = policy.validate("cat ../../../etc/passwd");
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('path traversal');
    });
  });

  // --- RUNTIME JAIL TESTS ---
  describe('AgentJail Execution Layer', () => {
    it('should execute a safe command and return stdout data', async () => {
      const result = await jail.execute("echo 'test-pass'");
      expect(result.isSafe).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test-pass');
    });

    // We pass 10000ms as a 3rd parameter so Jest lets the test finalize gracefully without a timeout error
    it('should forcefully kill infinite loops exceeding timeout thresholds', async () => {
      const isWindows = process.platform === 'win32';
      const loopCmd = isWindows 
        ? "powershell -Command \"while($true) { Start-Sleep 1 }\"" 
        : "while true; do sleep 1; done";

      // Forcing a swift 200ms container timeout traps the process instantly
      const result = await jail.execute(loopCmd, { timeoutMs: 200 });
      expect(result.error).toBe('Timeout Exceeded');
      expect(result.stderr).toContain('[AgentJail Timeout Error]');
    }, 10000); 
  });

  // --- VIRTUAL STORAGE TESTS ---
  describe('In-Memory Virtual File System', () => {
    it('should write and read virtual data without touching local hard drive disk storage', () => {
      const path = '/project/workspace/test.txt';
      vfs.writeFile(path, 'virtual-payload');
      
      expect(vfs.readFile(path)).toBe('virtual-payload');
      expect(vfs.readdir('/project/workspace')).toContain('test.txt');
    });

    it('should throw an explicit error map if attempting to read a non-existent file path node', () => {
      expect(() => {
        vfs.readFile('/project/workspace/ghost.json');
      }).toThrow('ENOENT');
    });
  });
});
