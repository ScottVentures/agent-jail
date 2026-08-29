# Agent-Jail 🔒🤖

A lightweight, programmatic, zero-dependency Node.js/TypeScript sandbox and hardware emulation gateway designed to safely anchor and execute instructions from autonomous AI Agents by ScottVentures.

---

## 💡 The Problem

Autonomous AI coding agents (like Claude Code, Aider, or custom multi-agent swarms) are incredibly powerful, but they pose significant security vulnerabilities. When granted access to execute raw shell instructions locally, an agent can accidentally overwrite system registries, trigger destructive commands (`rm -rf`), isolate networking layers, or exfiltrate private `.env` access tokens.

Existing sandbox solutions are heavy, slow, and complex—requiring full Docker daemon orchestration, virtual machine clusters, or expensive cloud environments.

## ✨ The Solution

**Agent-Jail** provides a lightweight, unopinionated, programmatic "jail" inside your local Node.js application scripts. It intercepts incoming commands, evaluates them against configurable string-parsing and pattern-matching security architectures, and spawns isolated sub-processes with absolute runtime limits and strict environment shielding. 

Additionally, it provides an **In-Memory Virtual File System (VFS)** to trick AI models into believing they are reading and mutating local file storage setups without ever touching your real physical hardware storage disk.

---

## 🛠️ Key Features

- **Strict AST/String Policy Engine:** Tokenizes incoming instructions, parses execution pipelines (`&&`, `||`, `;`, `|`), and instantly flags blacklisted commands or relative path traversal breakouts (`../`).
- **Sub-Process Isolation Layer:** Spawns sandboxed sub-shells with zero access to your primary system `process.env` configuration block unless explicitly whitelisted.
- **Infinite Loop Safeguards:** Enforces customizable performance timeouts (`timeoutMs`) to instantly terminate runaway recursive or hung script processes via hard `SIGKILL` flags.
- **Abstracted In-Memory VFS:** Implements a lightning-fast, mock virtual folder directory hierarchy layout mapping file creation, navigation, and modifications entirely inside temporary volatile memory strings.

---

## 📦 Project Architecture

```text
agent-jail/
├── dist/                  # Compiled JavaScript production build output
├── src/
│   ├── core/
│   │   ├── policy.ts      # Command tokenizing parsing & safety validations
│   │   └── jailer.ts      # Isolated child-process spawning execution engine
│   ├── mocks/
│   │   └── fsMock.ts      # High-performance In-Memory Virtual File System
│   └── index.ts          # Unified public package entry point
├── demo.ts                # Real-time multi-scenario demonstration runner
├── tsconfig.json          # Strict TypeScript compiler definitions (ESNext/CommonJS)
└── package.json           # Manifest metadata & dependencies catalog
```

---

## 🚀 Quick Start Guide

### Installation

### Installation

Install `agent-jail` directly from this GitHub repository into any destination project folder setup using npm:

```bash
npm install github:ScottVentures/agent-jail
```

### Complete Implementation Example

```typescript
import { SecurityPolicy, AgentJail, VirtualFileSystem } from 'agent-jail';

async function runSafeWorkflow() {
  // 1. Establish strict safety constraints
  const policy = new SecurityPolicy({
    allowedPaths: ['/project/workspace'],
    blockedCommands: ['sudo', 'su', 'rm', 'mv', 'chmod', 'poweroff'],
    maxCommandLength: 500
  });

  // 2. Instantiate the isolated environment with a 3-second hard timeout
  const jail = new AgentJail(policy, { timeoutMs: 3000 });

  // --- SCENARIO A: Safe Command Execution ---
  const safeInstruction = "echo 'Running tests...' && echo 'System operational.'";
  const resultA = await jail.execute(safeInstruction);
  
  console.log(resultA.isSafe);            // Output: true
  console.log(resultA.exitCode);          // Output: 0
  console.log(resultA.stdout);            // Output: Running tests...\nSystem operational.

  // --- SCENARIO B: Intercepting Destructive AI Behavior ---
  const maliciousInstruction = "rm -rf /project/workspace";
  const resultB = await jail.execute(maliciousInstruction);
  
  console.log(resultB.isSafe);            // Output: false
  console.log(resultB.error);             // Output: Security Policy Violation: The command binary 'rm' is blacklisted and restricted.

  // --- SCENARIO C: Utilizing the In-Memory Virtual File System (VFS) ---
  const vfs = new VirtualFileSystem();
  
  vfs.writeFile('/project/workspace/app.js', "console.log('Safe sandbox execution');");
  vfs.mkdir('/project/workspace/build');

  console.log(vfs.readdir('/project/workspace')); // Output: [ 'app.js', 'build' ]
  console.log(vfs.readFile('/project/workspace/app.js')); // Output: console.log('Safe sandbox execution');
}

runSafeWorkflow();
```

---

## ⚙️ Core Modules Configuration API

### `SecurityPolicy(config?: PolicyConfig)`
Creates the algorithmic gateway parsing rules engine layer.
- `allowedPaths?: string[]` - Explicit list of text strings matching paths the agent may interact with.
- `blockedCommands?: string[]` - Array of blacklisted CLI binary roots to filter out. Defaults to strong UNIX/Windows system-level constraints if left empty.
- `maxCommandLength?: number` - Limits command buffer string sizes to mitigate system strain. Defaults to `1000`.

### `AgentJail(policy, options?: JailOptions)`
Controls the system wrapper process engine routines.
- `timeoutMs?: number` - The maximum execution timeframe threshold allowance before the internal process watchdog forces child death pipelines. Defaults to `5000` (5 seconds).
- `env?: Record<string, string>` - Dictionary tracking exactly what ambient path environments are parsed down to sub-threads. Defaults to hiding all local computer configuration parameters.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
