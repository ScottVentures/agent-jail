export interface VirtualNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;                  // Only populated for files
  children?: Record<string, VirtualNode>; // Only populated for directories
  createdAt: Date;
  updatedAt: Date;
}

export class VirtualFileSystem {
  private root: VirtualNode;

  constructor() {
    this.root = {
      name: 'root',
      type: 'directory',
      children: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Seed it with a standard workspace folder for the AI agent
    this.mkdir('/project/workspace');
  }

  /**
   * Helper to resolve a string path into its constituent directory keys.
   */
  private parsePath(absolutePath: string): string[] {
    return absolutePath.split('/').filter(part => part.length > 0);
  }

  /**
   * Navigates the in-memory tree to locate a specific node.
   */
  private findNode(absolutePath: string): VirtualNode | null {
    const parts = this.parsePath(absolutePath);
    let current = this.root;

    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }
    return current;
  }

  /**
   * Creates a file or directory at a specific target destination path.
   */
  public writeFile(absolutePath: string, content: string): void {
    const parts = this.parsePath(absolutePath);
    if (parts.length === 0) return;

    const fileName = parts[parts.length - 1];
    const dirParts = parts.slice(0, -1);
    
    let current = this.root;

    // Traverse or automatically scaffold parent paths
    for (const part of dirParts) {
      if (!current.children) current.children = {};
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: 'directory',
          children: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      current = current.children[part];
    }

    if (!current.children) current.children = {};
    
    // Write or overwrite the destination file payload string
    current.children[fileName] = {
      name: fileName,
      type: 'file',
      content: content,
      createdAt: current.children[fileName]?.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Reads the text data out of an existing mock file node.
   */
  public readFile(absolutePath: string): string {
    const node = this.findNode(absolutePath);
    if (!node || node.type !== 'file') {
      throw new Error(`ENOENT: no such file, open '${absolutePath}'`);
    }
    return node.content || '';
  }

  /**
   * Instantiates an empty structural folder node layout block.
   */
  public mkdir(absolutePath: string): void {
    const parts = this.parsePath(absolutePath);
    let current = this.root;

    for (const part of parts) {
      if (!current.children) current.children = {};
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: 'directory',
          children: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      current = current.children[part];
    }
  }

  /**
   * Provides an directory index listing array (similar to a clean 'ls' command look).
   */
  public readdir(absolutePath: string): string[] {
    const node = this.findNode(absolutePath);
    if (!node || node.type !== 'directory') {
      throw new Error(`ENOENT: no such directory, open '${absolutePath}'`);
    }
    return Object.keys(node.children || {});
  }
}
