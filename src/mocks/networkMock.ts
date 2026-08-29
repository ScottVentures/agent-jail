export interface NetworkPolicyConfig {
  allowedDomains?: string[];  // Whitelist of domains the AI is allowed to hit
  blockedDomains?: string[];  // Explicitly banned domains
  mockResponses?: Record<string, { status: number; body: string }>; // Presets for mock endpoints
}

export interface NetworkValidationResult {
  isAllowed: boolean;
  reason?: string;
  mockedResponse?: { status: number; body: string };
}

export class NetworkGatewayGuard {
  private allowedDomains: string[];
  private blockedDomains: string[];
  private mockResponses: Record<string, { status: number; body: string }>;

  constructor(config: NetworkPolicyConfig = {}) {
    this.allowedDomains = config.allowedDomains || [];
    this.blockedDomains = config.blockedDomains || ['malicious-actor.com', 'pastebin.com', 'webhook.site'];
    
    // Seed standard endpoints so your AI agent gets back valid, stable structural metadata
    this.mockResponses = config.mockResponses || {
      '://github.com': { status: 200, body: JSON.stringify({ message: "Mocked GitHub API Endpoint Access Verified" }) },
      'registry.npmjs.org': { status: 200, body: JSON.stringify({ version: "1.0.0" }) }
    };
  }

  /**
   * Scans a network request command (like curl or wget strings) to validate destinations.
   */
  public validateRequest(commandString: string): NetworkValidationResult {
    // 1. Extract potential URL tokens using a clean domain matching pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = commandString.match(urlRegex);

    if (!matches) {
      // If the command doesn't hint at any explicit web URL, clear it safely
      return { isAllowed: true };
    }

    for (const rawUrl of matches) {
      try {
        const parsedUrl = new URL(rawUrl);
        const host = parsedUrl.hostname.toLowerCase();

        // 2. Check explicitly banned data-exfiltration endpoints
        if (this.blockedDomains.some(domain => host.includes(domain))) {
          return {
            isAllowed: false,
            reason: `Network Access Blocked: Domain '${host}' is blacklisted to prevent potential data exfiltration.`
          };
        }

        // 3. Enforce strict whitelist protections if defined
        if (this.allowedDomains.length > 0) {
          const isWhitelisted = this.allowedDomains.some(domain => host.includes(domain));
          if (!isWhitelisted) {
            return {
              isAllowed: false,
              reason: `Network Access Blocked: Domain '${host}' is not on the explicit whitelist profile.`
            };
          }
        }

        // 4. Return pre-configured mock data if the domain matches our local mocks
        if (this.mockResponses[host]) {
          return {
            isAllowed: true,
            mockedResponse: this.mockResponses[host]
          };
        }

      } catch (err) {
        return {
          isAllowed: false,
          reason: "Network Access Blocked: Malformed or unparseable destination URL token structure detected."
        };
      }
    }

    // Default to clearing standard harmless connections if no policy maps trap it
    return { isAllowed: true };
  }
}
