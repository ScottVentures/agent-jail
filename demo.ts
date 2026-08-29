import { SecurityPolicy, AgentJail, VirtualFileSystem } from './src';

async function runLocalSandboxDemo() {
  console.log("🚀 Initializing Agent-Jail Security Sandbox Environment...\n");

  // 1. Initialize our sub-systems
  const vfs = new VirtualFileSystem();
  
  const policy = new SecurityPolicy({
    allowedPaths: ['/project/workspace'],
    blockedCommands: ['sudo', 'rm', 'mv', 'poweroff', 'shutdown'],
    maxCommandLength: 500
  });

  // Limit execution runtimes to 2.5 seconds to instantly trap runaway AI code
  const jail = new AgentJail(policy, { timeoutMs: 2500 });

  // 2. Test Case A: Safe, allowed engineering command
  console.log("--------------------------------------------------");
  console.log("🧪 TEST CASE A: Running a safe diagnostic script...");
  const safeCmd = "echo 'Initializing software bundle...' && echo 'System status: Green'";
  
  const resA = await jail.execute(safeCmd);
  console.log(`🔒 Passed Security Check? ${resA.isSafe}`);
  console.log(`📉 Exit Status Code: ${resA.exitCode}`);
  console.log(`📋 Output Stream (stdout):\n${resA.stdout.trim()}`);
  console.log(`⏱️ Execution Time: ${resA.executionTimeMs}ms\n`);

  // 3. Test Case B: Malicious Breakout Attempt (Using a blacklisted binary)
  console.log("--------------------------------------------------");
  console.log("🧪 TEST CASE B: Intercepting a malicious 'rm' payload...");
  const dangerousCmd = "rm -rf /project/workspace && echo 'Deleted!'";

  const resB = await jail.execute(dangerousCmd);
  console.log(`🔒 Passed Security Check? ${resB.isSafe}`);
  console.log(`❌ Interception Reason: ${resB.error}`);
  console.log(`📋 Output Stream (stdout): [EMPTY - BLOCKED]\n`);

  // 4. Test Case C: Runaway/Infinite Loop Safeguard
  console.log("--------------------------------------------------");
  console.log("🧪 TEST CASE C: Handling a runaway or hung loop process...");
  // A standard shell loop that runs forever
  const hungCmd = isWindowsProcess() 
    ? "powershell -Command \"while($true) { Start-Sleep 1 }\"" 
    : "while true; do sleep 1; done";

  console.log("⏳ Spawning loop (Will auto-terminate if timeout limits are crossed)...");
  const resC = await jail.execute(hungCmd);
  console.log(`🔒 Passed Security Check? ${resC.isSafe}`);
  console.log(`🛑 Termination Status: ${resC.error}`);
  console.log(`📋 Error Log (stderr):\n${resC.stderr.trim()}`);
  console.log(`⏱️ Force-Killed after: ${resC.executionTimeMs}ms\n`);

  // 5. Interact with our In-Memory Virtual File System (VFS)
  console.log("--------------------------------------------------");
  console.log("🧪 TEST CASE D: Utilizing the isolated In-Memory VFS...");
  console.log("Writing structural files to the abstracted playground storage...");
  
  vfs.writeFile('/project/workspace/config.json', JSON.stringify({ dbConnected: true, port: 8080 }, null, 2));
  vfs.mkdir('/project/workspace/src');
  vfs.writeFile('/project/workspace/src/main.ts', "console.log('Hello World');");

  console.log("Reading workspace context listings via virtual readdir:");
  const workspaceContents = vfs.readdir('/project/workspace');
  console.log(workspaceContents); // Output: [ 'config.json', 'src' ]

  console.log("\nReading exact virtual file contents:");
  console.log(vfs.readFile('/project/workspace/config.json'));
}

function isWindowsProcess(): boolean {
  return typeof process !== 'undefined' && process.platform === 'win32';
}

runLocalSandboxDemo().catch(console.error);
