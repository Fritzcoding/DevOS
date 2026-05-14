export interface ElectronAPI {
  organizeFolder: (path: string, rules?: any) => Promise<any>;
  applyOrganization: (path: string, org: any) => Promise<void>;
  detectEnv: (projectPath: string) => Promise<any>;
  setupEnv: (projectPath: string, envType: string) => Promise<any>;
  readFile: (filePath: string) => Promise<string>;
  fixCode: (code: string, language: string, prompt: string) => Promise<any>;
  chatAI: (message: string, context?: string) => Promise<any>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
