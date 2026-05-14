import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type PermissionType = 'FILE_ACCESS' | 'VSCODE_QUERY' | 'SHELL_EXECUTE';

export interface PermissionState {
  [key: string]: boolean; // "FILE_ACCESS" | "VSCODE_QUERY" | "SHELL_EXECUTE" → granted (true) or denied (false)
}

/**
 * Manages user permissions for sensitive operations.
 * Stores granted/denied permissions in a config file.
 * Provides centralized permission checking and requesting.
 */
export class PermissionManager {
  private readonly configDir = path.join(os.homedir(), '.devops-lite-config');
  private readonly permissionsPath = path.join(this.configDir, 'permissions.json');
  private permissions: PermissionState = {};
  private sessionCache: PermissionState = {}; // In-session cache

  constructor() {
    this.ensureConfigDir();
    this.loadPermissions();
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDir(): void {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
    } catch (e) {
      console.error(`Failed to create config dir: ${this.configDir}`, e);
    }
  }

  /**
   * Load permissions from disk
   */
  private loadPermissions(): void {
    try {
      if (fs.existsSync(this.permissionsPath)) {
        const data = fs.readFileSync(this.permissionsPath, 'utf8');
        this.permissions = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load permissions file', e);
      this.permissions = {};
    }
  }

  /**
   * Save permissions to disk
   */
  private savePermissions(): void {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.permissionsPath, JSON.stringify(this.permissions, null, 2));
    } catch (e) {
      console.error('Failed to save permissions file', e);
    }
  }

  /**
   * Check if permission is granted
   * Returns: true (granted), false (denied), null (not set)
   */
  public hasPermission(permission: PermissionType): boolean | null {
    // Check session cache first
    if (permission in this.sessionCache) {
      return this.sessionCache[permission];
    }

    // Check persistent storage
    if (permission in this.permissions) {
      return this.permissions[permission];
    }

    // Not set
    return null;
  }

  /**
   * Grant permission (store in persistent storage + session cache)
   */
  public grantPermission(permission: PermissionType): void {
    this.permissions[permission] = true;
    this.sessionCache[permission] = true;
    this.savePermissions();
  }

  /**
   * Deny permission (store in persistent storage + session cache)
   */
  public denyPermission(permission: PermissionType): void {
    this.permissions[permission] = false;
    this.sessionCache[permission] = false;
    this.savePermissions();
  }

  /**
   * Check permission; request if not set
   * Note: This is a placeholder for IPC call to renderer process
   * The actual permission dialog is shown in React component
   * This method should be called from main process; it will emit IPC event to renderer
   */
  public async checkPermission(
    permission: PermissionType,
    onRequestDialog?: (permission: PermissionType) => Promise<boolean>
  ): Promise<boolean> {
    const existing = this.hasPermission(permission);

    if (existing !== null) {
      return existing;
    }

    // Permission not set, request from user via callback
    if (onRequestDialog) {
      const granted = await onRequestDialog(permission);
      if (granted) {
        this.grantPermission(permission);
      } else {
        this.denyPermission(permission);
      }
      return granted;
    }

    // No callback provided, default deny
    this.denyPermission(permission);
    return false;
  }

  /**
   * Reset all permissions (for testing or user settings)
   */
  public resetAllPermissions(): void {
    this.permissions = {};
    this.sessionCache = {};
    this.savePermissions();
  }

  /**
   * Reset specific permission
   */
  public resetPermission(permission: PermissionType): void {
    delete this.permissions[permission];
    delete this.sessionCache[permission];
    this.savePermissions();
  }

  /**
   * Get all permissions (for debugging)
   */
  public getAllPermissions(): PermissionState {
    return { ...this.permissions };
  }

  /**
   * Get description of a permission type
   */
  public getPermissionDescription(permission: PermissionType): string {
    const descriptions: { [key in PermissionType]: string } = {
      FILE_ACCESS: 'Access to read project files and directories',
      VSCODE_QUERY: 'Query VS Code workspace settings and extensions',
      SHELL_EXECUTE: 'Execute shell commands for environment setup',
    };
    return descriptions[permission] || 'Unknown permission';
  }

  /**
   * Get all permission descriptions
   */
  public getAllPermissionDescriptions(): { [key in PermissionType]: string } {
    return {
      FILE_ACCESS: 'Access to read project files and directories',
      VSCODE_QUERY: 'Query VS Code workspace settings and extensions',
      SHELL_EXECUTE: 'Execute shell commands for environment setup',
    };
  }
}

// Export singleton instance
export const permissionManager = new PermissionManager();
