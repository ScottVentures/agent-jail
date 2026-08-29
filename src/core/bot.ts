import { AgentJail } from './jailer';
import { SecurityPolicy } from './policy';

export interface MockPrompt {
  id: string;
  role: string;
  userPrompt: string;
  aiGeneratedCommand: string;
}

export class AgentChatBotSimulator {
  private jail: AgentJail;
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy, jail: AgentJail) {
    this.jail = jail;
    this.policy = policy;
  }

  /**
   * Processes a structured prompt payload stream through the entire security sandbox stack.
   */
  public async processPromptFeed(feed: MockPrompt[]): Promise<void> {
    console.log(`🤖 Starting Agent Chat Bot Automation Suite (${feed.length} items in feed)...\n`);

    for (const item of feed) {
      console.log(`--------------------------------------------------`);
      console.log(`🆔 [Task ${item.id}] | User Intent: "${item.userPrompt}"`);
      console.log(`🧠 AI Suggested Action: \`${item.aiGeneratedCommand}\``);

      const result = await this.jail.execute(item.aiGeneratedCommand);

      if (!result.isSafe) {
        console.log(`❌ [BLOCKED BY SECURITY GATEWAY]`);
        console.log(`🛡️  Violation: ${result.error}`);
      } else if (result.error === 'Timeout Exceeded') {
        console.log(`🛑 [FORCE-TERMINATED BY RUNTIME WATCHDOG]`);
        console.log(`⏱️  Killed at ${result.executionTimeMs}ms due to runaway infinite processing loops.`);
      } else if (result.exitCode !== 0) {
        console.log(`⚠️  [EXECUTION RUNTIME ERROR]`);
        console.log(`📋 Log (stderr):\n${result.stderr.trim()}`);
      } else {
        console.log(`✅ [SUCCESSFULLY EXECUTED SAFELY]`);
        console.log(`📋 Output Stream (stdout):\n${result.stdout.trim()}`);
        console.log(`⏱️  Performance: ${result.executionTimeMs}ms`);
      }
      console.log();
    }

    console.log(`🏁 All feed prompts processed cleanly.`);
  }
}
